import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Payment service with proper error handling
export const paymentService = {
  // Get available payment methods
  async getPaymentMethods() {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/methods`);
      return {
        success: true,
        data: response.data || [
          {
            id: 'bank_transfer',
            name: 'Bank Transfer',
            icon: 'CreditCard',
            description: 'Transfer to our bank account',
            fee: 0,
            isActive: true,
            requiresProof: true
          },
          {
            id: 'e_wallet',
            name: 'E-Wallet',
            icon: 'Wallet',
            description: 'Dana, OVO, GoPay, LinkAja',
            fee: 0.025,
            isActive: true,
            requiresProof: true
          },
          {
            id: 'cash_on_delivery',
            name: 'Cash on Delivery',
            icon: 'Truck',
            description: 'Pay when your order arrives',
            fee: 0,
            isActive: true,
            requiresProof: false
          }
        ]
      };
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payment methods'
      };
    }
  },

  // Get payment configuration
  async getPaymentConfig() {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/config`);
      return {
        success: true,
        data: response.data || {
          minimumOrderAmount: 50000,
          maximumOrderAmount: 5000000,
          deliveryChargeThreshold: 100000,
          gatewayFees: {
            bank_transfer: 0,
            e_wallet: 0.025,
            cash_on_delivery: 0
          }
        }
      };
    } catch (error) {
      console.error('Error fetching payment config:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payment configuration'
      };
    }
  },

  // Process payment
  async processPayment(paymentData) {
    try {
      if (!paymentData || !paymentData.orderId) {
        throw new Error('Invalid payment data');
      }

      const response = await axios.post(`${API_BASE_URL}/payment/process`, paymentData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to process payment'
      };
    }
  },

  // Verify payment
  async verifyPayment(transactionId) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      const response = await axios.get(`${API_BASE_URL}/payment/verify/${transactionId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error verifying payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to verify payment'
      };
    }
  },

  // Upload payment proof
  async uploadPaymentProof(transactionId, proofData) {
    try {
      if (!transactionId || !proofData) {
        throw new Error('Transaction ID and proof data are required');
      }

      const formData = new FormData();
      formData.append('transactionId', transactionId);
      formData.append('proof', proofData);

      const response = await axios.post(`${API_BASE_URL}/payment/upload-proof`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error uploading payment proof:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload payment proof'
      };
    }
  },

  // Get payment history
  async getPaymentHistory(userId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/payment/history/${userId}`);
      return {
        success: true,
        data: response.data || []
      };
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch payment history'
      };
    }
  },

  // Cancel payment
  async cancelPayment(transactionId) {
    try {
      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      const response = await axios.post(`${API_BASE_URL}/payment/cancel/${transactionId}`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error canceling payment:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to cancel payment'
      };
    }
  }
};

export default paymentService;