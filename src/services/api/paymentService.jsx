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
  },

  // Wallet Management Methods
  async getWalletBalance() {
    try {
      // Mock wallet balance for development
      const mockBalance = 15000 + Math.floor(Math.random() * 10000);
      return mockBalance;
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw new Error('Failed to get wallet balance');
    }
  },

  async getWalletTransactions() {
    try {
      // Mock wallet transactions for development
      const mockTransactions = [
        {
          id: 'wt_001',
          type: 'deposit',
          amount: 5000,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          description: 'Deposit from bank account',
          status: 'completed'
        },
        {
          id: 'wt_002',
          type: 'withdrawal',
          amount: 2500,
          date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          description: 'Withdrawal to bank account',
          status: 'completed'
        },
        {
          id: 'wt_003',
          type: 'transfer',
          amount: 1000,
          date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
          description: 'Transfer to supplier',
          status: 'pending'
        }
      ];
      return mockTransactions;
    } catch (error) {
      console.error('Error getting wallet transactions:', error);
      throw new Error('Failed to get wallet transactions');
    }
  },

  async depositToWallet(amount) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Mock deposit operation
      const transaction = {
        id: `dep_${Date.now()}`,
        type: 'deposit',
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        status: 'completed',
        description: `Deposit of Rs. ${amount.toLocaleString()}`
      };

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      console.error('Error depositing to wallet:', error);
      throw new Error(error.message || 'Failed to deposit to wallet');
    }
  },

  async withdrawFromWallet(amount) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Mock withdrawal operation
      const transaction = {
        id: `wit_${Date.now()}`,
        type: 'withdrawal',
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        status: 'completed',
        description: `Withdrawal of Rs. ${amount.toLocaleString()}`
      };

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      console.error('Error withdrawing from wallet:', error);
      throw new Error(error.message || 'Failed to withdraw from wallet');
    }
  },

  async transferFromWallet(amount, recipient) {
    try {
      if (!amount || amount <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Mock transfer operation
      const transaction = {
        id: `tra_${Date.now()}`,
        type: 'transfer',
        amount: parseFloat(amount),
        date: new Date().toISOString(),
        status: 'completed',
        description: `Transfer of Rs. ${amount.toLocaleString()}${recipient ? ` to ${recipient}` : ''}`,
        recipient: recipient || 'Unknown'
      };

      return {
        success: true,
        data: transaction
      };
    } catch (error) {
      console.error('Error transferring from wallet:', error);
      throw new Error(error.message || 'Failed to transfer from wallet');
    }
  }
};
export default paymentService;