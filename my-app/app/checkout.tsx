import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PAYMENT_NETWORKS = [
  { code: "MTN", name: "MTN Mobile Money", icon: "phone-portrait-outline" as const },
  { code: "AIRTELTIGO", name: "AirtelTigo Money", icon: "phone-portrait-outline" as const },
  { code: "VODAFONE", name: "Vodafone Cash", icon: "phone-portrait-outline" as const },
];

function resolveApiBaseUrl() {
  const configured =
    process.env.EXPO_PUBLIC_ADMIN_APPROVAL_API_URL?.trim() || "http://localhost:5050";

  if (!configured.includes("localhost") && !configured.includes("127.0.0.1")) {
    return configured;
  }

  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest?.debuggerHost,
  ].filter(Boolean);

  const host = hostCandidates[0]?.split(":")[0];

  if (host) {
    return configured
      .replace("localhost", host)
      .replace("127.0.0.1", host);
  }

  if (Platform.OS === "android") {
    return configured
      .replace("localhost", "10.0.2.2")
      .replace("127.0.0.1", "10.0.2.2");
  }

  return configured;
}

function normalizeApiBaseUrl(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  let u = raw.trim();
  u = u.replace(/\/+$/, "");
  if (/:\\d{2,5}/.test(u)) return u;
  const m = u.match(/\.(\d{2,5})(?:$|\/)/);
  if (m) {
    u = u.replace(`.${m[1]}`, `:${m[1]}`);
  }
  return u;
}

async function fetchWithTimeout(resource: RequestInfo | URL, options: RequestInit = {}, timeout: number = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return resp;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}


type CartItem = {
  id: number;
  name: string;
  price: number;
  qty: number;
  unit: string;
  image: string;
};

export default function CheckoutScreen() {
  const API_URL = normalizeApiBaseUrl(resolveApiBaseUrl());
  const params = useLocalSearchParams();
  const paymentReminderSentForOrder = useRef<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Payment Method, 3: Payment
  const [loading, setLoading] = useState(false);
  const [orderCreationError, setOrderCreationError] = useState("");

  // Form state
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState("card"); // "card" or "momo"
  const [selectedNetwork, setSelectedNetwork] = useState("MTN");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [orderId, setOrderId] = useState("");

  // Parse cart from params
  useEffect(() => {
    if (params.cart) {
      try {
        const cartParam = Array.isArray(params.cart) ? params.cart[0] : params.cart;
        const parsedCart = JSON.parse(decodeURIComponent(cartParam));
        setCart(parsedCart);
      } catch (error) {
        console.error("Failed to parse cart:", error);
        Alert.alert("Error", "Failed to load cart items");
        router.back();
      }
    }
  }, [params.cart]);

  useEffect(() => {
    Notifications.requestPermissionsAsync().catch(() => null);
  }, []);

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  useEffect(() => {
    if (currentStep !== 2 || !orderId) {
      return;
    }

    if (paymentReminderSentForOrder.current === orderId) {
      return;
    }

    paymentReminderSentForOrder.current = orderId;
    Notifications.scheduleNotificationAsync({
      content: {
        title: "Complete your payment",
        body: `Your FarmConnect order total is GHS ${totalAmount.toFixed(2)}. Tap to finish payment.`,
        data: { orderId },
      },
      trigger: null,
    }).catch(() => null);
  }, [currentStep, orderId, totalAmount]);

  // Validate buyer details
  const validateBuyerDetails = () => {
    if (!buyerName.trim()) {
      Alert.alert("Validation", "Please enter your full name");
      return false;
    }
    if (!buyerEmail.trim() || !buyerEmail.includes("@")) {
      Alert.alert("Validation", "Please enter a valid email address");
      return false;
    }
    if (!buyerPhone.trim()) {
      Alert.alert("Validation", "Please enter your phone number");
      return false;
    }
    if (!deliveryAddress.trim()) {
      Alert.alert("Validation", "Please enter your delivery address");
      return false;
    }
    return true;
  };

  // Create order and proceed to payment
  const handleProceedToPayment = async () => {
    if (!validateBuyerDetails()) return;

    setOrderCreationError("");
    setCurrentStep(2);

    // Create the order in the background so the payment step renders immediately.
    setLoading(true);
    try {
      // Create order
      const orderResponse = await fetchWithTimeout(`${API_URL}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyerEmail,
          buyerPhone,
          items: cart,
          totalAmount,
          deliveryAddress,
          notes,
          paymentMethod: paymentMethod === "card" ? "card" : "momo",
        }),
      }, 15000);

      const orderData = await orderResponse.json();

      if (!orderData.ok) {
        setOrderCreationError(orderData.error || "Failed to create order.");
        Alert.alert(
          "Order Error",
          `${orderData.error || "Failed to create order"}\n\nAPI: ${API_URL}/orders`
        );
        return;
      }

      setOrderId(orderData.orderId);
    } catch (error) {
      console.error("Order creation error:", error);
      const message = `Failed to create order. Please check backend connection.\n\nAPI: ${API_URL}/orders`;
      setOrderCreationError(message);
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  // Initiate card payment
  const handleCardPayment = async () => {
    if (!orderId) {
      Alert.alert(
        "Order Not Ready",
        orderCreationError || "Please wait for the order to finish saving, then try again."
      );
      return;
    }

    setLoading(true);
    try {
      const paymentResponse = await fetchWithTimeout(`${API_URL}/orders/${orderId}/pay-card`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }, 15000);

      const paymentData = await paymentResponse.json();

      if (!paymentData.ok) {
        Alert.alert("Payment Error", paymentData.error || "Failed to initiate payment");
        return;
      }

      // In production, open the Paystack authorization URL
      Alert.alert(
        "Card Payment",
        `Test Mode: Payment reference is ${paymentData.reference}\n\nIn production, you would be redirected to Paystack to complete payment.`,
        [
          {
            text: "Cancel",
            onPress: () => setCurrentStep(2),
          },
          {
            text: "Simulate Payment Success",
            onPress: () => handlePaymentSuccess(),
          },
        ]
      );
    } catch (error) {
      console.error("Card payment error:", error);
      Alert.alert("Error", "Failed to initiate card payment");
    } finally {
      setLoading(false);
    }
  };

  // Initiate mobile money payment
  const handleMobileMoneyPayment = async () => {
    if (!paymentPhone.trim()) {
      Alert.alert("Validation", "Please enter your phone number for payment");
      return;
    }

    if (!orderId) {
      Alert.alert(
        "Order Not Ready",
        orderCreationError || "Please wait for the order to finish saving, then try again."
      );
      return;
    }

    setLoading(true);
    try {
      const paymentResponse = await fetchWithTimeout(`${API_URL}/orders/${orderId}/pay-momo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: paymentPhone,
          network: selectedNetwork,
        }),
      }, 15000);

      const paymentData = await paymentResponse.json();

      if (!paymentData.ok) {
        Alert.alert("Payment Error", paymentData.error || "Failed to initiate payment");
        return;
      }

      // Show payment instructions
      Alert.alert(
        "Mobile Money Payment",
        `${paymentData.message}\n\nUSSD Code: ${paymentData.ussdCode}\n\nAmount: GHS ${totalAmount.toFixed(2)}`,
        [
          {
            text: "Cancel",
            onPress: () => setCurrentStep(2),
          },
          {
            text: "Payment Completed",
            onPress: () => handlePaymentSuccess(),
          },
        ]
      );
    } catch (error) {
      console.error("Mobile money payment error:", error);
      Alert.alert("Error", "Failed to initiate mobile money payment");
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async () => {
    Alert.alert("Success", "Thank you for your purchase! Your order has been confirmed.", [
      {
        text: "Done",
        onPress: () => {
          router.replace("/buyer");
        },
      },
    ]);
  };

  // Render step 1: Buyer details
  const renderBuyerDetails = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Delivery Information</Text>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="John Doe"
          value={buyerName}
          onChangeText={setBuyerName}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.input}
          placeholder="john@example.com"
          keyboardType="email-address"
          value={buyerEmail}
          onChangeText={setBuyerEmail}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="+233 554 000 000"
          keyboardType="phone-pad"
          value={buyerPhone}
          onChangeText={setBuyerPhone}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Delivery Address *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Enter your full delivery address"
          multiline
          numberOfLines={3}
          value={deliveryAddress}
          onChangeText={setDeliveryAddress}
          editable={!loading}
        />
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Any special instructions for delivery..."
          multiline
          numberOfLines={2}
          value={notes}
          onChangeText={setNotes}
          editable={!loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleProceedToPayment}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="card-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Review Payment Method</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  // Render step 2: Payment method selection
  const renderPaymentMethod = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Select Payment Method</Text>

      {orderCreationError ? (
        <View style={styles.inlineError}>
          <Ionicons name="warning-outline" size={16} color="#b45309" />
          <Text style={styles.inlineErrorText}>{orderCreationError}</Text>
        </View>
      ) : null}

      {/* Card Payment Option */}
      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === "card" && styles.paymentOptionSelected]}
        onPress={() => setPaymentMethod("card")}
      >
        <View style={styles.paymentOptionContent}>
          <Ionicons name="card-outline" size={24} color={paymentMethod === "card" ? "#10b981" : "#6b7280"} />
          <View style={styles.paymentOptionText}>
            <Text style={styles.paymentOptionTitle}>Credit/Debit Card</Text>
            <Text style={styles.paymentOptionDesc}>Visa, Mastercard via Paystack</Text>
          </View>
        </View>
        <Ionicons
          name={paymentMethod === "card" ? "checkmark-circle" : "ellipse-outline"}
          size={20}
          color={paymentMethod === "card" ? "#10b981" : "#d1d5db"}
        />
      </TouchableOpacity>

      {/* Mobile Money Option */}
      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === "momo" && styles.paymentOptionSelected]}
        onPress={() => setPaymentMethod("momo")}
      >
        <View style={styles.paymentOptionContent}>
          <Ionicons name="phone-portrait-outline" size={24} color={paymentMethod === "momo" ? "#10b981" : "#6b7280"} />
          <View style={styles.paymentOptionText}>
            <Text style={styles.paymentOptionTitle}>Mobile Money</Text>
            <Text style={styles.paymentOptionDesc}>MTN, AirtelTigo, Vodafone</Text>
          </View>
        </View>
        <Ionicons
          name={paymentMethod === "momo" ? "checkmark-circle" : "ellipse-outline"}
          size={20}
          color={paymentMethod === "momo" ? "#10b981" : "#d1d5db"}
        />
      </TouchableOpacity>

      {/* Mobile Money Network Selection */}
      {paymentMethod === "momo" && (
        <>
          <Text style={[styles.label, { marginTop: 24 }]}>Select Your Network</Text>
          {PAYMENT_NETWORKS.map((network) => (
            <TouchableOpacity
              key={network.code}
              style={[styles.networkOption, selectedNetwork === network.code && styles.networkOptionSelected]}
              onPress={() => setSelectedNetwork(network.code)}
            >
              <Ionicons name={network.icon} size={20} color={selectedNetwork === network.code ? "#10b981" : "#6b7280"} />
              <Text style={[styles.networkName, selectedNetwork === network.code && styles.networkNameSelected]}>
                {network.name}
              </Text>
              {selectedNetwork === network.code ? (
                <Ionicons name="checkmark" size={18} color="#10b981" />
              ) : (
                <View style={{ width: 18, height: 18 }} />
              )}
            </TouchableOpacity>
          ))}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number for Payment</Text>
            <TextInput
              style={styles.input}
              placeholder="+233 554 000 000"
              keyboardType="phone-pad"
              value={paymentPhone}
              onChangeText={setPaymentPhone}
              editable={!loading}
            />
          </View>
        </>
      )}

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setCurrentStep(1)}
        >
          <Ionicons name="chevron-back" size={18} color="#10b981" />
          <Text style={styles.buttonTextSecondary}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled, { flex: 1, marginLeft: 12 }]}
          onPress={() => setCurrentStep(3)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
              <Text style={styles.buttonText}>Continue to Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render step 3: Payment confirmation
  const renderPaymentConfirmation = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Confirm Payment</Text>

      {/* Order Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Order Summary</Text>
        {cart.map((item) => (
          <View key={item.id} style={styles.summaryItem}>
            <Text style={styles.summaryItemName}>{item.name}</Text>
            <Text style={styles.summaryItemPrice}>
              {item.qty}x GHS {item.price.toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={styles.summaryDivider} />
        <View style={styles.summaryTotal}>
          <Text style={styles.summaryTotalLabel}>Total Amount</Text>
          <Text style={styles.summaryTotalValue}>GHS {totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Buyer Info */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Delivery To</Text>
        <Text style={styles.summaryText}>{buyerName}</Text>
        <Text style={styles.summaryText}>{buyerEmail}</Text>
        <Text style={styles.summaryText}>{buyerPhone}</Text>
        <Text style={styles.summaryText}>{deliveryAddress}</Text>
      </View>

      {/* Payment Method */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Payment Method</Text>
        <Text style={styles.summaryText}>
          {paymentMethod === "card" ? "Credit/Debit Card (Paystack)" : `${selectedNetwork} Mobile Money`}
        </Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => setCurrentStep(2)}
          disabled={loading}
        >
          <Ionicons name="chevron-back" size={18} color="#10b981" />
          <Text style={styles.buttonTextSecondary}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton, loading && styles.buttonDisabled, { flex: 1, marginLeft: 12 }]}
          onPress={paymentMethod === "card" ? handleCardPayment : handleMobileMoneyPayment}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={18} color="#fff" />
              <Text style={styles.buttonText}>Complete Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#10b981" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3].map((step) => (
          <View key={step}>
            <View
              style={[
                styles.progressDot,
                step <= currentStep && styles.progressDotActive,
              ]}
            >
              <Text style={styles.progressDotText}>{step}</Text>
            </View>
            {step < 3 && (
              <View
                style={[
                  styles.progressLine,
                  step < currentStep && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderBuyerDetails()}
        {currentStep === 2 && renderPaymentMethod()}
        {currentStep === 3 && renderPaymentConfirmation()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e7eb" },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },

  // Progress
  progressContainer: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 24, paddingHorizontal: 16, backgroundColor: "#fff" },
  progressDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  progressDotActive: { backgroundColor: "#10b981" },
  progressDotText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  progressLine: { width: 40, height: 2, backgroundColor: "#e5e7eb", marginHorizontal: 8 },
  progressLineActive: { backgroundColor: "#10b981" },

  // Content
  content: { flex: 1 },
  stepContainer: { padding: 20 },
  stepTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 20 },

  // Forms
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#111827" },
  textArea: { paddingVertical: 12, textAlignVertical: "top" },

  // Payment Options
  paymentOption: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentOptionSelected: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  paymentOptionContent: { flexDirection: "row", alignItems: "center", flex: 1 },
  paymentOptionText: { marginLeft: 12, flex: 1 },
  paymentOptionTitle: { fontSize: 15, fontWeight: "600", color: "#111827" },
  paymentOptionDesc: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  inlineError: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#f59e0b", borderRadius: 10, padding: 12, marginBottom: 16 },
  inlineErrorText: { flex: 1, fontSize: 13, color: "#92400e", lineHeight: 18 },

  // Network Options
  networkOption: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center" },
  networkOptionSelected: { borderColor: "#10b981", backgroundColor: "#f0fdf4" },
  networkName: { fontSize: 14, color: "#374151", marginLeft: 10, flex: 1, fontWeight: "500" },
  networkNameSelected: { color: "#10b981" },

  // Summary
  summaryCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  summaryTitle: { fontSize: 15, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryItemName: { fontSize: 14, color: "#374151" },
  summaryItemPrice: { fontSize: 14, fontWeight: "600", color: "#10b981" },
  summaryDivider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 },
  summaryTotal: { flexDirection: "row", justifyContent: "space-between" },
  summaryTotalLabel: { fontSize: 15, fontWeight: "bold", color: "#111827" },
  summaryTotalValue: { fontSize: 18, fontWeight: "bold", color: "#10b981" },
  summaryText: { fontSize: 14, color: "#374151", marginBottom: 6, lineHeight: 20 },

  // Buttons
  buttonRow: { flexDirection: "row", marginTop: 24, marginBottom: 32 },
  button: { flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 12, borderRadius: 8, gap: 8 },
  primaryButton: { backgroundColor: "#10b981" },
  secondaryButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#10b981", flex: 0.35 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  buttonTextSecondary: { color: "#10b981", fontSize: 15, fontWeight: "600" },
});
