class PaymentService {
  constructor() {
    this.transactions = [];
    this.walletBalance = 25000; // Initial wallet balance
    this.walletTransactions = [];
    this.cardBrands = {
      '4': 'visa',
      '5': 'mastercard',
      '3': 'amex',
      '6': 'discover'
    };
  }

  // Card Payment Processing
  async processCardPayment(cardData, amount, orderId) {
    await this.delay(2000); // Simulate processing time

    // Validate card data
    const validation = this.validateCardData(cardData);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Simulate payment gateway response
    const success = Math.random() > 0.1; // 90% success rate
    
    if (!success) {
      throw new Error('Payment declined. Please try again or use a different card.');
    }

    const transaction = {
      Id: this.getNextId(),
      orderId,
      amount,
      paymentMethod: 'card',
      cardLast4: cardData.cardNumber.slice(-4),
      cardBrand: this.getCardBrand(cardData.cardNumber),
      status: 'completed',
      transactionId: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      processingFee: 0,
      gatewayResponse: {
        authCode: this.generateAuthCode(),
        reference: this.generateReference()
      }
    };

    this.transactions.push(transaction);
    return { ...transaction };
  }

  // Digital Wallet Payment Processing
  async processDigitalWalletPayment(walletType, amount, orderId, phone) {
    await this.delay(1500);

    // Validate phone number for Pakistani wallets
    if (!phone || !this.validatePakistaniPhone(phone)) {
      throw new Error('Please provide a valid Pakistani phone number');
    }

    const success = Math.random() > 0.05; // 95% success rate for digital wallets
    
    if (!success) {
      throw new Error(`${walletType} payment failed. Please try again.`);
    }

    const fee = this.calculateDigitalWalletFee(amount);
    
    const transaction = {
      Id: this.getNextId(),
      orderId,
      amount,
      paymentMethod: walletType,
      phone,
      status: 'completed',
      transactionId: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      processingFee: fee,
      gatewayResponse: {
        walletTransactionId: this.generateWalletTransactionId(walletType),
        reference: this.generateReference()
      }
    };

    this.transactions.push(transaction);
    return { ...transaction };
  }

  // Bank Transfer Processing
  async processBankTransfer(amount, orderId, bankDetails) {
    await this.delay(1000);

    const transaction = {
      Id: this.getNextId(),
      orderId,
      amount,
      paymentMethod: 'bank',
      bankAccount: bankDetails?.accountNumber?.slice(-4) || 'XXXX',
      status: 'pending_verification',
      transactionId: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      processingFee: 20,
      requiresVerification: true,
      gatewayResponse: {
        reference: this.generateReference(),
        instructions: 'Please transfer the amount to the provided bank account and upload the receipt.'
      }
    };

    this.transactions.push(transaction);
    return { ...transaction };
  }

  // Payment Verification
  async verifyPayment(transactionId, verificationData) {
    await this.delay(500);

    const transaction = this.transactions.find(t => t.transactionId === transactionId);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'completed') {
      return { verified: true, transaction };
    }

    // Simulate verification process
    const verified = Math.random() > 0.2; // 80% verification success rate

    if (verified) {
      transaction.status = 'completed';
      transaction.verifiedAt = new Date().toISOString();
      transaction.verificationData = verificationData;
    } else {
      transaction.status = 'verification_failed';
      transaction.failureReason = 'Unable to verify payment. Please contact support.';
    }

    return { verified, transaction: { ...transaction } };
return { verified, transaction: { ...transaction } };
  }

  // Enhanced Payment Retry Logic
  async retryPayment(originalTransactionId, retryData) {
    await this.delay(1000);
    
    const originalTransaction = this.transactions.find(t => t.transactionId === originalTransactionId);
    if (!originalTransaction) {
      throw new Error('Original transaction not found');
    }
    
    // Create retry transaction
    const retryTransaction = {
      Id: this.getNextId(),
      orderId: originalTransaction.orderId,
      amount: originalTransaction.amount,
      paymentMethod: originalTransaction.paymentMethod,
      status: 'processing',
      transactionId: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      isRetry: true,
      originalTransactionId: originalTransactionId,
      retryAttempt: (originalTransaction.retryAttempt || 0) + 1,
      ...retryData
    };
    
    // Simulate retry processing
    const success = Math.random() > 0.3; // 70% success rate for retries
    
    if (success) {
      retryTransaction.status = 'completed';
      retryTransaction.gatewayResponse = {
        authCode: this.generateAuthCode(),
        reference: this.generateReference()
      };
    } else {
      retryTransaction.status = 'failed';
      retryTransaction.failureReason = 'Retry payment failed';
    }
    
    this.transactions.push(retryTransaction);
    return { ...retryTransaction };
  }

  // Enhanced Error Handling
  async handlePaymentError(transactionId, errorDetails) {
    await this.delay(300);
    
    const transaction = this.transactions.find(t => t.transactionId === transactionId);
    if (transaction) {
      transaction.status = 'failed';
      transaction.errorDetails = errorDetails;
      transaction.failedAt = new Date().toISOString();
    }
    
    return transaction;
  }
  getAvailablePaymentMethods() {
    return [
      {
        id: 'cash',
        name: 'Cash on Delivery',
        enabled: true,
        fee: 0,
        description: 'Pay when you receive your order'
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        enabled: true,
        fee: 0,
        description: 'Visa, Mastercard, American Express'
      },
      {
        id: 'jazzcash',
        name: 'JazzCash',
        enabled: true,
        fee: 0.01, // 1%
        minimumFee: 5,
        description: 'Mobile wallet payment'
      },
      {
        id: 'easypaisa',
        name: 'EasyPaisa',
        enabled: true,
        fee: 0.01, // 1%
        minimumFee: 5,
        description: 'Mobile wallet payment'
      },
      {
        id: 'bank',
        name: 'Bank Transfer',
        enabled: true,
        fee: 20,
        description: 'Direct bank transfer'
      },
      {
        id: 'sadapay',
        name: 'SadaPay',
        enabled: true,
        fee: 0,
        description: 'Digital wallet'
      }
    ];
  }

  // Transaction History
  async getTransactionHistory(orderId) {
    await this.delay(300);
    return this.transactions.filter(t => t.orderId === orderId);
  }

  async getAllTransactions() {
    await this.delay(300);
    return [...this.transactions];
  }

  async getTransactionById(id) {
    await this.delay(300);
    const transaction = this.transactions.find(t => t.Id === id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    return { ...transaction };
  }

  // Utility Methods
  validateCardData(cardData) {
    const { cardNumber, expiryDate, cvv, cardholderName } = cardData;

    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      return { valid: false, error: 'Invalid card number' };
    }

    if (!expiryDate || !expiryDate.match(/^(0[1-9]|1[0-2])\/\d{2}$/)) {
      return { valid: false, error: 'Invalid expiry date' };
    }

    if (!cvv || cvv.length < 3) {
      return { valid: false, error: 'Invalid CVV' };
    }

    if (!cardholderName || cardholderName.trim().length < 2) {
      return { valid: false, error: 'Invalid cardholder name' };
    }

    // Check if card is expired
    const [month, year] = expiryDate.split('/');
    const expiry = new Date(2000 + parseInt(year), parseInt(month) - 1);
    if (expiry < new Date()) {
      return { valid: false, error: 'Card has expired' };
    }

    return { valid: true };
  }

  validatePakistaniPhone(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.length === 11 && cleanPhone.startsWith('03');
  }

  getCardBrand(cardNumber) {
    const firstDigit = cardNumber.charAt(0);
    return this.cardBrands[firstDigit] || 'unknown';
  }

  calculateDigitalWalletFee(amount) {
    const feePercent = 0.01; // 1%
    const minimumFee = 5;
    return Math.max(amount * feePercent, minimumFee);
  }

  generateTransactionId() {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }

  generateAuthCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }

  generateReference() {
    return 'REF' + Date.now().toString().slice(-8);
  }

  generateWalletTransactionId(walletType) {
    const prefix = walletType.toUpperCase().substr(0, 3);
    return prefix + Date.now().toString().slice(-8);
  }

  getNextId() {
    const maxId = this.transactions.reduce((max, transaction) => 
      transaction.Id > max ? transaction.Id : max, 0);
    return maxId + 1;
  }
// Wallet Management Methods
  async getWalletBalance() {
    await this.delay(200);
    return this.walletBalance;
  }

  async updateWalletBalance(amount) {
    await this.delay(200);
    this.walletBalance += amount;
    return this.walletBalance;
  }

  async depositToWallet(amount) {
    await this.delay(500);
    
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }

    this.walletBalance += amount;
    
    const transaction = {
      Id: this.getWalletTransactionId(),
      type: 'deposit',
      amount,
      balance: this.walletBalance,
      timestamp: new Date().toISOString(),
      description: 'Wallet deposit',
      reference: this.generateReference()
    };

    this.walletTransactions.push(transaction);
    return { ...transaction };
  }

  async withdrawFromWallet(amount) {
    await this.delay(500);
    
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }

    if (amount > this.walletBalance) {
      throw new Error('Insufficient wallet balance');
    }

    this.walletBalance -= amount;
    
    const transaction = {
      Id: this.getWalletTransactionId(),
      type: 'withdraw',
      amount,
      balance: this.walletBalance,
      timestamp: new Date().toISOString(),
      description: 'Wallet withdrawal',
      reference: this.generateReference()
    };

    this.walletTransactions.push(transaction);
    return { ...transaction };
  }

  async transferFromWallet(amount, recipientId = null) {
    await this.delay(500);
    
    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    if (amount > this.walletBalance) {
      throw new Error('Insufficient wallet balance');
    }

    this.walletBalance -= amount;
    
    const transaction = {
      Id: this.getWalletTransactionId(),
      type: 'transfer',
      amount,
      balance: this.walletBalance,
      timestamp: new Date().toISOString(),
      description: `Wallet transfer${recipientId ? ` to ${recipientId}` : ''}`,
      reference: this.generateReference(),
      recipientId
    };

    this.walletTransactions.push(transaction);
    return { ...transaction };
  }

  async processWalletPayment(amount, orderId) {
    await this.delay(500);
    
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    if (amount > this.walletBalance) {
      throw new Error('Insufficient wallet balance for payment');
    }

    this.walletBalance -= amount;
    
    const transaction = {
      Id: this.getWalletTransactionId(),
      type: 'payment',
      amount,
      balance: this.walletBalance,
      timestamp: new Date().toISOString(),
      description: `Payment for order #${orderId}`,
      reference: this.generateReference(),
      orderId
    };

    this.walletTransactions.push(transaction);
    return { ...transaction };
  }

  async getWalletTransactions(limit = 50) {
    await this.delay(300);
    return [...this.walletTransactions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async getWalletTransactionById(id) {
    await this.delay(300);
    const transaction = this.walletTransactions.find(t => t.Id === id);
    if (!transaction) {
      throw new Error('Wallet transaction not found');
    }
    return { ...transaction };
  }

  getWalletTransactionId() {
    const maxId = this.walletTransactions.reduce((max, transaction) => 
      transaction.Id > max ? transaction.Id : max, 0);
    return maxId + 1;
  }

// Gateway Configuration Management
  async getGatewayConfig() {
    await this.delay(200);
    return {
      cardGateway: {
        provider: 'stripe',
        enabled: true,
        apiKey: 'pk_test_xxxxx'
      },
      walletGateways: {
        jazzcash: { enabled: true, merchantId: 'JC123' },
        easypaisa: { enabled: true, merchantId: 'EP456' },
        sadapay: { enabled: true, merchantId: 'SP789' }
      },
      bankGateway: {
        enabled: true,
        accounts: [
          { bank: 'HBL', account: '1234567890' },
          { bank: 'UBL', account: '0987654321' }
        ]
      }
    };
  }

  async updateGatewayConfig(gatewayId, config) {
    await this.delay(300);
    // In a real implementation, this would update the gateway configuration
    return { success: true, gatewayId, config };
  }

  async getGatewayStatus(gatewayId) {
    await this.delay(200);
    const methods = this.getAvailablePaymentMethods();
    const method = methods.find(m => m.id === gatewayId);
    return method ? { enabled: method.enabled, status: 'active' } : { enabled: false, status: 'inactive' };
  }

  async enableGateway(gatewayId) {
    await this.delay(300);
    // Update the payment method status
    const methods = this.getAvailablePaymentMethods();
    const methodIndex = methods.findIndex(m => m.id === gatewayId);
    if (methodIndex !== -1) {
      methods[methodIndex].enabled = true;
    }
    return { success: true, gatewayId, enabled: true };
  }

  async disableGateway(gatewayId) {
    await this.delay(300);
    // Update the payment method status
    const methods = this.getAvailablePaymentMethods();
    const methodIndex = methods.findIndex(m => m.id === gatewayId);
    if (methodIndex !== -1) {
      methods[methodIndex].enabled = false;
    }
    return { success: true, gatewayId, enabled: false };
  }

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const paymentService = new PaymentService();