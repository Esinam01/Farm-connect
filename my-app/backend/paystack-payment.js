const axios = require('axios');

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

// Initialize payment with Paystack
const initializePayment = async (email, amount, reference) => {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: Math.round(amount * 100), // Paystack uses cents
        reference,
        metadata: {
          custom_fields: [
            {
              display_name: 'Order Reference',
              variable_name: 'order_ref',
              value: reference,
            },
          ],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      ok: true,
      data: response.data.data,
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code,
      reference: response.data.data.reference,
    };
  } catch (error) {
    console.error('Paystack initialization error:', error.response?.data || error.message);
    return {
      ok: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

// Verify payment with Paystack
const verifyPayment = async (reference) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
        },
      }
    );

    const transaction = response.data.data;
    return {
      ok: true,
      status: transaction.status,
      verified: transaction.status === 'success',
      reference: transaction.reference,
      amount: transaction.amount / 100, // Convert from cents
      customer_email: transaction.customer.email,
      data: transaction,
    };
  } catch (error) {
    console.error('Paystack verification error:', error.response?.data || error.message);
    return {
      ok: false,
      verified: false,
      error: error.response?.data?.message || error.message,
    };
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
};
