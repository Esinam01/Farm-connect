const axios = require('axios');

// Ghana Mobile Money Networks
const NETWORKS = {
  MTN: {
    name: 'MTN Mobile Money',
    code: 'MTN',
    shortCode: '170',
  },
  AIRTELTIGO: {
    name: 'AirtelTigo Money',
    code: 'AIRTELTIGO',
    shortCode: '170',
  },
  VODAFONE: {
    name: 'Vodafone Cash',
    code: 'VODAFONE',
    shortCode: '110',
  },
};

// Initialize Mobile Money Request
// For testing: This would connect to MTN/AirtelTigo/Vodafone APIs
// For production: Use a mobile money aggregator or direct API integration
const initiateMobileMoneyPayment = async (phoneNumber, amount, network, reference) => {
  try {
    // Validate phone number (Ghana format)
    if (!phoneNumber.match(/^(0|233)?[579]\d{8}$/)) {
      return {
        ok: false,
        error: 'Invalid Ghana phone number format. Use format: 0554000000 or 233554000000',
      };
    }

    // Validate network
    if (!NETWORKS[network]) {
      return {
        ok: false,
        error: `Invalid network. Supported: ${Object.keys(NETWORKS).join(', ')}`,
      };
    }

    // For production, integrate with:
    // 1. MTN Mobile Money API
    // 2. Payfort / Flutterwave mobile money
    // 3. Direct mobile money provider APIs

    // TEST MODE: Simulate payment request
    // In production, replace with actual API call
    const paymentRequest = {
      reference,
      phone: phoneNumber,
      amount: parseFloat(amount),
      network: NETWORKS[network].name,
      currency: 'GHS',
      timestamp: new Date().toISOString(),
      status: 'initiated',
    };

    // Log for testing (in production, this would be an actual API call)
    console.log(`🔔 Mobile Money Payment Initiated:`, paymentRequest);
    console.log(`📱 User will receive USSD/SMS on ${phoneNumber}`);
    console.log(`💰 Amount: GHS ${amount} on ${NETWORKS[network].name}`);

    return {
      ok: true,
      reference,
      network: NETWORKS[network].name,
      phone: phoneNumber,
      amount: parseFloat(amount),
      currency: 'GHS',
      message: `Payment request sent to ${phoneNumber} on ${NETWORKS[network].name}. Please complete the transaction.`,
      ussdCode: `*${NETWORKS[network].shortCode}#`, // Typical USSD pattern for Ghana
    };
  } catch (error) {
    console.error('Mobile Money initialization error:', error.message);
    return {
      ok: false,
      error: error.message,
    };
  }
};

// Verify Mobile Money Payment
// In production: Poll the payment provider's API or use webhooks
const verifyMobileMoneyPayment = async (reference) => {
  try {
    // In production, verify with actual mobile money provider
    // For testing: Return mock successful payment
    
    // This would normally make an API call to verify the payment status
    // Example: Check MTN Mobile Money API or payment aggregator status
    
    return {
      ok: true,
      reference,
      status: 'pending', // Would be 'success' or 'failed' from API
      message: 'Payment status verification pending. Check with payment provider.',
      // In production, these would come from the actual API
      verified: false, // Set to true when payment provider confirms
    };
  } catch (error) {
    console.error('Mobile Money verification error:', error.message);
    return {
      ok: false,
      verified: false,
      error: error.message,
    };
  }
};

// Get supported networks
const getSupportedNetworks = () => {
  return Object.values(NETWORKS).map((net) => ({
    code: net.code,
    name: net.name,
    country: 'Ghana',
  }));
};

module.exports = {
  initiateMobileMoneyPayment,
  verifyMobileMoneyPayment,
  getSupportedNetworks,
  NETWORKS,
};
