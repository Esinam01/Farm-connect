const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const {
  initDatabase,
  createOrder,
  addOrderItem,
  getOrderById,
  getOrderItemsByOrderId,
  getPaymentsByOrderId,
  createPayment,
  updateOrderStatus,
  updatePaymentStatus,
  getSupportedPaymentNetworks,
} = require("./db");
const { initializePayment, verifyPayment } = require("./paystack-payment");
const { initiateMobileMoneyPayment, verifyMobileMoneyPayment, getSupportedNetworks } = require("./momo-payment");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 5050);
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`;

const requestsById = new Map();
const requestIdByToken = new Map();

// ─── RATE LIMITING FOR ADMIN ACCESS ────────────────────────────────────────
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_HOUR = 3;
const adminAccessLog = new Map(); // Map<ip, { count: number, firstRequestTime: number }>

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown"
  );
}

function checkRateLimit(ip) {
  const now = Date.now();
  const logEntry = adminAccessLog.get(ip);

  if (!logEntry) {
    adminAccessLog.set(ip, { count: 1, firstRequestTime: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 };
  }

  const timeSinceFirstRequest = now - logEntry.firstRequestTime;

  // Reset counter if window has passed
  if (timeSinceFirstRequest > RATE_LIMIT_WINDOW) {
    adminAccessLog.set(ip, { count: 1, firstRequestTime: now });
    return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - 1 };
  }

  // Check if limit exceeded
  if (logEntry.count >= MAX_REQUESTS_PER_HOUR) {
    const timeRemaining = Math.ceil((RATE_LIMIT_WINDOW - timeSinceFirstRequest) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfter: timeRemaining,
    };
  }

  // Increment counter
  logEntry.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS_PER_HOUR - logEntry.count };
}

function logAdminAccessAttempt(ip, requestId, status) {
  console.log(`[Admin Access] IP: ${ip}, RequestID: ${requestId}, Status: ${status}, Time: ${new Date().toISOString()}`);
}

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || "false") === "true",
    auth: { user, pass },
  });
}

async function sendApprovalEmail({ to, approveUrl, requestId }) {
  const transporter = buildTransporter();

  if (!transporter) {
    // Fallback for local setup if SMTP credentials are not provided.
    console.log("[Admin Approval] SMTP not configured.");
    console.log("[Admin Approval] Request ID:", requestId);
    console.log("[Admin Approval] Approve URL:", approveUrl);
    return { sent: false, fallback: true };
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "FarmConnect Admin Approval Request",
    html: `
      <h2>Admin Access Approval</h2>
      <p>A user requested admin access for FarmConnect.</p>
      <p>Request ID: <b>${requestId}</b></p>
      <p>
        <a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#16a34a;color:#fff;text-decoration:none;border-radius:8px;">
          Approve Admin Access
        </a>
      </p>
      <p>If you did not expect this, ignore the email.</p>
    `,
  });

  return { sent: true, fallback: false };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "admin-approval-backend" });
});

app.post("/admin-access/request", async (req, res) => {
  const clientIp = getClientIp(req);
  const approverEmail = req.body?.approverEmail || "marydoo211@gmail.com";
  
  // Check rate limit
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    logAdminAccessAttempt(clientIp, "rate-limited", "REJECTED");
    return res.status(429).json({
      status: "rate_limited",
      message: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`,
      retryAfter: rateLimit.retryAfter,
    });
  }

  const requestId = uuidv4();
  const token = uuidv4();
  const approveUrl = `${PUBLIC_BASE_URL}/admin-access/approve?token=${encodeURIComponent(token)}`;

  const requestRecord = {
    requestId,
    token,
    approverEmail,
    status: "pending",
    createdAt: new Date().toISOString(),
    approvedAt: null,
    clientIp,
  };

  requestsById.set(requestId, requestRecord);
  requestIdByToken.set(token, requestId);

  logAdminAccessAttempt(clientIp, requestId, "INITIATED");

  try {
    const emailResult = await sendApprovalEmail({
      to: approverEmail,
      approveUrl,
      requestId,
    });

    logAdminAccessAttempt(clientIp, requestId, "EMAIL_SENT");

    res.json({
      requestId,
      status: requestRecord.status,
      emailed: emailResult.sent,
      fallback: emailResult.fallback,
      approveUrl: emailResult.fallback ? approveUrl : undefined,
      message: emailResult.fallback
        ? "SMTP not configured. Use approveUrl manually for local testing."
        : "Approval email sent.",
    });
  } catch (error) {
    requestRecord.status = "error";
    logAdminAccessAttempt(clientIp, requestId, "ERROR");
    res.status(500).json({
      requestId,
      status: "error",
      message: "Failed to send approval email.",
      details: String(error?.message || error),
    });
  }
});

app.get("/admin-access/status", (req, res) => {
  const requestId = String(req.query.requestId || "");
  const record = requestsById.get(requestId);

  if (!record) {
    res.status(404).json({ status: "not_found", message: "Unknown requestId." });
    return;
  }

  res.json({
    requestId: record.requestId,
    status: record.status,
    createdAt: record.createdAt,
    approvedAt: record.approvedAt,
  });
});

app.get("/admin-access/approve", (req, res) => {
  const token = String(req.query.token || "");
  const requestId = requestIdByToken.get(token);

  if (!requestId) {
    logAdminAccessAttempt("unknown", "invalid-token", "REJECTED");
    res.status(404).send("<h2>Invalid or expired approval token.</h2>");
    return;
  }

  const record = requestsById.get(requestId);
  if (!record) {
    logAdminAccessAttempt(record?.clientIp || "unknown", requestId, "NOT_FOUND");
    res.status(404).send("<h2>Request not found.</h2>");
    return;
  }

  record.status = "approved";
  record.approvedAt = new Date().toISOString();

  logAdminAccessAttempt(record.clientIp, requestId, "APPROVED");

  res.send(`
    <html>
      <body style="font-family:Arial,sans-serif;padding:24px;">
        <h2 style="color:#16a34a;">Admin access approved</h2>
        <p>Request ID: <b>${record.requestId}</b></p>
        <p>You can now return to the FarmConnect app.</p>
      </body>
    </html>
  `);
});

// Optional cleanup for old records (24h)
setInterval(() => {
  const now = Date.now();
  for (const [requestId, record] of requestsById.entries()) {
    const ageMs = now - new Date(record.createdAt).getTime();
    if (ageMs > 24 * 60 * 60 * 1000) {
      requestsById.delete(requestId);
      requestIdByToken.delete(record.token);
    }
  }
}, 60 * 60 * 1000);

// ─── PAYMENT ENDPOINTS ─────────────────────────────────────────────────────

// Get supported payment networks
app.get("/payment/networks", async (_req, res) => {
  const networks = await getSupportedPaymentNetworks();
  res.json({
    ok: true,
    networks,
    message: "Available payment networks in Ghana",
  });
});

// Create order and initiate payment
app.post("/orders", async (req, res) => {
  try {
    const {
      buyerEmail,
      buyerPhone,
      items,
      totalAmount,
      deliveryAddress,
      notes,
      paymentMethod, // "card" or "momo"
      momoNetwork, // Required if paymentMethod === "momo"
    } = req.body;

    // Validate required fields
    if (!buyerEmail || !items || !totalAmount) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: buyerEmail, items, totalAmount",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "Items must be a non-empty array",
      });
    }

    const orderResult = await createOrder({
      buyerEmail,
      buyerPhone,
      totalAmount,
      deliveryAddress,
      notes,
      paymentMethod,
    });

    const orderId = orderResult.id;

    // Insert order items
    for (const item of items) {
      await addOrderItem({
        orderId,
        productId: item.id,
        productName: item.name,
        price: item.price,
        quantity: item.qty,
      });
    }

    res.status(201).json({
      ok: true,
      orderId,
      orderStatus: "pending",
      paymentStatus: "pending",
      message: "Order created successfully",
    });
  } catch (error) {
    console.error("Order creation error:", error.message);
    res.status(500).json({
      ok: false,
      error: "Failed to create order",
      details: error.message,
    });
  }
});

// Get order details
app.get("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    const itemsResult = await getOrderItemsByOrderId(orderId);

    const paymentsResult = await getPaymentsByOrderId(orderId);

    res.json({
      ok: true,
      order: {
        ...order,
        items: itemsResult,
        payments: paymentsResult,
      },
    });
  } catch (error) {
    console.error("Get order error:", error.message);
    res.status(500).json({
      ok: false,
      error: "Failed to fetch order",
      details: error.message,
    });
  }
});

// Initiate card payment (Paystack)
app.post("/orders/:orderId/pay-card", async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    if (order.payment_status !== "pending") {
      return res.status(400).json({
        ok: false,
        error: "This order has already been paid or cannot be paid",
      });
    }

    // Initialize Paystack payment
    const paymentRef = `ORDER_${orderId.substring(0, 8).toUpperCase()}_${Date.now()}`;
    const paystackResult = await initializePayment(
      order.buyer_email,
      order.total_amount,
      paymentRef
    );

    if (!paystackResult.ok) {
      return res.status(400).json({
        ok: false,
        error: paystackResult.error,
      });
    }

    // Record payment attempt in database
    await createPayment({
      orderId,
      paymentMethod: "card",
      amount: order.total_amount,
      status: "initiated",
      referenceId: paymentRef,
      gatewayResponse: paystackResult.data,
    });

    res.json({
      ok: true,
      orderId,
      authorizationUrl: paystackResult.authorizationUrl,
      accessCode: paystackResult.accessCode,
      reference: paystackResult.reference,
      message: "Redirect user to authorization URL to complete payment",
    });
  } catch (error) {
    console.error("Card payment initialization error:", error.message);
    res.status(500).json({
      ok: false,
      error: "Failed to initialize card payment",
      details: error.message,
    });
  }
});

// Verify card payment
app.get("/orders/:orderId/verify-card", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        ok: false,
        error: "Payment reference is required",
      });
    }

    // Verify with Paystack
    const verificationResult = await verifyPayment(reference);

    if (!verificationResult.ok) {
      return res.status(400).json({
        ok: false,
        error: verificationResult.error,
      });
    }

    if (verificationResult.verified) {
      // Update order and payment status
      await updateOrderStatus({ orderId, paymentStatus: "completed", orderStatus: "confirmed" });

      await updatePaymentStatus({ orderId, paymentMethod: "card", status: "completed" });

      return res.json({
        ok: true,
        verified: true,
        orderId,
        paymentStatus: "completed",
        orderStatus: "confirmed",
        message: "Payment verified successfully",
      });
    }

    res.json({
      ok: true,
      verified: false,
      status: verificationResult.status,
      message: "Payment not yet verified",
    });
  } catch (error) {
    console.error("Card payment verification error:", error.message);
    res.status(500).json({
      ok: false,
      error: "Failed to verify payment",
      details: error.message,
    });
  }
});

// Initiate mobile money payment
app.post("/orders/:orderId/pay-momo", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phoneNumber, network } = req.body;

    if (!phoneNumber || !network) {
      return res.status(400).json({
        ok: false,
        error: "Phone number and network are required",
      });
    }

    const order = await getOrderById(orderId);

    if (!order) {
      return res.status(404).json({
        ok: false,
        error: "Order not found",
      });
    }

    if (order.payment_status !== "pending") {
      return res.status(400).json({
        ok: false,
        error: "This order has already been paid or cannot be paid",
      });
    }

    // Initiate mobile money payment
    const paymentRef = `MOMO_${orderId.substring(0, 8).toUpperCase()}_${Date.now()}`;
    const momoResult = await initiateMobileMoneyPayment(
      phoneNumber,
      order.total_amount,
      network,
      paymentRef
    );

    if (!momoResult.ok) {
      return res.status(400).json({
        ok: false,
        error: momoResult.error,
      });
    }

    // Record payment attempt
    await createPayment({
      orderId,
      paymentMethod: "momo",
      amount: order.total_amount,
      status: "initiated",
      referenceId: paymentRef,
      gatewayResponse: momoResult,
    });

    // Update order to indicate payment method
    await updateOrderStatus({ orderId, paymentMethod: "momo" });

    res.json({
      ok: true,
      orderId,
      reference: momoResult.reference,
      network: momoResult.network,
      message: momoResult.message,
      ussdCode: momoResult.ussdCode,
      pollUrl: `/orders/${orderId}/verify-momo?reference=${paymentRef}`,
    });
  } catch (error) {
    console.error("Mobile money payment initialization error:", error.message);
    res.status(500).json({
      ok: false,
      error: "Failed to initialize mobile money payment",
      details: error.message,
    });
  }
});

// Verify mobile money payment
app.get("/orders/:orderId/verify-momo", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({
        ok: false,
        error: "Payment reference is required",
      });
    }

    // Verify with mobile money provider
    const verificationResult = await verifyMobileMoneyPayment(reference);

    if (!verificationResult.ok) {
      return res.status(400).json({
        ok: false,
        error: verificationResult.error,
      });
    }

    if (verificationResult.verified) {
      // Update order and payment status
      await updateOrderStatus({ orderId, paymentStatus: "completed", orderStatus: "confirmed" });

      await updatePaymentStatus({ orderId, paymentMethod: "momo", status: "completed" });

      return res.json({
        ok: true,
        verified: true,
        orderId,
        paymentStatus: "completed",
        orderStatus: "confirmed",
        message: "Payment verified successfully",
      });
    }

    res.json({
      ok: true,
      verified: false,
      status: verificationResult.status,
      message: verificationResult.message,
    });
  } catch (error) {
    console.error("Mobile money verification error:", error.message);
    res.status(500).json({
      ok: false,
      error: "Failed to verify payment",
      details: error.message,
    });
  }
});

// ─── INITIALIZATION ───────────────────────────────────────────────────────

// Initialize database on startup
const startServer = async () => {
  try {
    await initDatabase();
    console.log("✓ Database ready");

    app.listen(PORT, () => {
      console.log(`[FarmConnect Backend] running on ${PUBLIC_BASE_URL}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
