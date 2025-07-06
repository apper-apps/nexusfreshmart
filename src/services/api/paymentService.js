class PaymentService {
constructor() {
    this.transactions = [];
    this.walletBalance = 25000; // Initial wallet balance
    this.walletTransactions = [];
    this.vendors = [];
    this.vendorBills = [];
    this.vendorPayments = [];
    this.paymentProofs = [];
    this.currentUserRole = 'admin';
    this.financeManagerRole = 'finance_manager';
    this.cardBrands = {
      '4': 'visa',
      '5': 'mastercard',
      '3': 'amex',
      '6': 'discover'
    };
    
    // Initialize payment gateways storage
    this.paymentGateways = [
      {
        Id: 1,
        id: 'cash',
        name: 'Cash on Delivery',
        enabled: true,
        fee: 0,
        description: 'Pay when you receive your order',
        accountName: '',
        accountNumber: '',
        instructions: ''
      },
      {
        Id: 2,
        id: 'jazzcash',
        name: 'JazzCash',
        enabled: true,
        fee: 0.01,
        minimumFee: 5,
        description: 'Mobile wallet payment',
        accountName: 'FreshMart Store',
        accountNumber: '03001234567',
        instructions: 'Send money to the above JazzCash number and upload payment screenshot.'
      },
      {
        Id: 3,
        id: 'easypaisa',
        name: 'EasyPaisa',
        enabled: true,
        fee: 0.01,
        minimumFee: 5,
        description: 'Mobile wallet payment',
        accountName: 'FreshMart Store',
        accountNumber: '03009876543',
        instructions: 'Send money to the above EasyPaisa number and upload payment screenshot.'
      }
    ];
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
    }

    // Return verification result
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
async getAvailablePaymentMethods() {
    await this.delay(200);
    return [...this.paymentGateways];
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
    const timestamp = Date.now().toString();
    const randomStr = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `TXN${timestamp}${randomStr}`;
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
    const gateway = this.paymentGateways.find(g => g.Id === gatewayId);
    return gateway ? { enabled: gateway.enabled, status: 'active' } : { enabled: false, status: 'inactive' };
  }

  async enableGateway(gatewayId) {
    await this.delay(300);
    const gateway = this.paymentGateways.find(g => g.Id === gatewayId);
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }
    gateway.enabled = true;
    return { success: true, gatewayId, enabled: true };
  }

  async disableGateway(gatewayId) {
    await this.delay(300);
    const gateway = this.paymentGateways.find(g => g.Id === gatewayId);
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }
    gateway.enabled = false;
    return { success: true, gatewayId, enabled: false };
  }

  // Gateway CRUD Operations
  async createGateway(gatewayData) {
    await this.delay(500);
    
    if (!gatewayData.name || !gatewayData.accountName || !gatewayData.accountNumber) {
      throw new Error('Name, account name, and account number are required');
    }

    const gateway = {
      Id: this.getNextGatewayId(),
      id: gatewayData.name.toLowerCase().replace(/\s+/g, '_'),
      name: gatewayData.name,
      accountName: gatewayData.accountName,
      accountNumber: gatewayData.accountNumber,
      instructions: gatewayData.instructions || '',
      fee: parseFloat(gatewayData.fee) / 100 || 0, // Convert percentage to decimal
      enabled: gatewayData.enabled !== false,
      description: `${gatewayData.name} payment gateway`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.paymentGateways.push(gateway);
    return { ...gateway };
  }

  async updateGateway(gatewayId, gatewayData) {
    await this.delay(400);
    
    const gateway = this.paymentGateways.find(g => g.Id === gatewayId);
    if (!gateway) {
      throw new Error('Payment gateway not found');
    }

    Object.assign(gateway, {
      name: gatewayData.name || gateway.name,
      accountName: gatewayData.accountName || gateway.accountName,
      accountNumber: gatewayData.accountNumber || gateway.accountNumber,
      instructions: gatewayData.instructions || gateway.instructions,
      fee: gatewayData.fee !== undefined ? parseFloat(gatewayData.fee) / 100 : gateway.fee,
      enabled: gatewayData.enabled !== undefined ? gatewayData.enabled : gateway.enabled,
      updatedAt: new Date().toISOString()
    });

    return { ...gateway };
  }

  async deleteGateway(gatewayId) {
    await this.delay(300);
    
    const index = this.paymentGateways.findIndex(g => g.Id === gatewayId);
    if (index === -1) {
      throw new Error('Payment gateway not found');
    }

    // Prevent deletion of cash on delivery
    if (this.paymentGateways[index].id === 'cash') {
      throw new Error('Cannot delete cash on delivery gateway');
    }

    this.paymentGateways.splice(index, 1);
    return { success: true };
  }

  getNextGatewayId() {
    const maxId = this.paymentGateways.reduce((max, gateway) => 
      gateway.Id > max ? gateway.Id : max, 0);
    return maxId + 1;
  }

delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Vendor CRUD Operations
  async createVendor(vendorData) {
    await this.delay(500);
    
    if (!vendorData.name || !vendorData.email || !vendorData.phone) {
      throw new Error('Vendor name, email, and phone are required');
    }

    const vendor = {
      Id: this.getNextVendorId(),
      name: vendorData.name,
      email: vendorData.email,
      phone: vendorData.phone,
      address: vendorData.address || '',
      taxId: vendorData.taxId || '',
      bankAccount: vendorData.bankAccount || '',
      paymentTerms: vendorData.paymentTerms || 'Net 30',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalPaid: 0,
      totalOwed: 0,
      lastPaymentDate: null
    };

    this.vendors.push(vendor);
    return { ...vendor };
  }

  async updateVendor(vendorId, vendorData) {
    await this.delay(400);
    
    const vendor = this.vendors.find(v => v.Id === vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    Object.assign(vendor, {
      ...vendorData,
      updatedAt: new Date().toISOString()
    });

    return { ...vendor };
  }

  async deleteVendor(vendorId) {
    await this.delay(300);
    
    const index = this.vendors.findIndex(v => v.Id === vendorId);
    if (index === -1) {
      throw new Error('Vendor not found');
    }

    // Check for pending payments
    const pendingPayments = this.vendorPayments.filter(p => 
      p.vendorId === vendorId && p.status === 'pending'
    );
    
    if (pendingPayments.length > 0) {
      throw new Error('Cannot delete vendor with pending payments');
    }

    this.vendors.splice(index, 1);
    return { success: true };
  }

  async getAllVendors() {
    await this.delay(300);
    return [...this.vendors];
  }

  async getVendorById(vendorId) {
    await this.delay(200);
    const vendor = this.vendors.find(v => v.Id === vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }
    return { ...vendor };
  }

  // Vendor Bill Management
  async createVendorBill(billData) {
    await this.delay(500);
    
    if (!this.validateFinanceManagerRole()) {
      throw new Error('Insufficient permissions. Finance manager role required.');
    }

    if (!billData.vendorId || !billData.amount || !billData.description) {
      throw new Error('Vendor ID, amount, and description are required');
    }

    const vendor = this.vendors.find(v => v.Id === billData.vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const bill = {
      Id: this.getNextBillId(),
      vendorId: billData.vendorId,
      vendorName: vendor.name,
      amount: billData.amount,
      description: billData.description,
      billNumber: billData.billNumber || this.generateBillNumber(),
      dueDate: billData.dueDate || this.calculateDueDate(vendor.paymentTerms),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: this.currentUserRole,
      category: billData.category || 'general',
      taxAmount: billData.taxAmount || 0,
      totalAmount: billData.amount + (billData.taxAmount || 0)
    };

    this.vendorBills.push(bill);
    
    // Update vendor total owed
    vendor.totalOwed += bill.totalAmount;
    vendor.updatedAt = new Date().toISOString();

    return { ...bill };
  }

  async processVendorBillPayment(billId, paymentData) {
    await this.delay(800);
    
    if (!this.validateFinanceManagerRole()) {
      throw new Error('Insufficient permissions. Finance manager role required.');
    }

    const bill = this.vendorBills.find(b => b.Id === billId);
    if (!bill) {
      throw new Error('Bill not found');
    }

    if (bill.status === 'paid') {
      throw new Error('Bill is already paid');
    }

    const vendor = this.vendors.find(v => v.Id === bill.vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    // Validate payment amount
    if (paymentData.amount > bill.totalAmount) {
      throw new Error('Payment amount cannot exceed bill amount');
    }

    const payment = {
      Id: this.getNextPaymentId(),
      billId: billId,
      vendorId: bill.vendorId,
      vendorName: vendor.name,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod || 'bank_transfer',
      status: 'pending_proof',
      transactionId: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      paidBy: this.currentUserRole,
      reference: paymentData.reference || '',
      notes: paymentData.notes || '',
      requiresProof: true,
      proofStatus: 'pending'
    };

    this.vendorPayments.push(payment);

    // Update bill status
    if (paymentData.amount >= bill.totalAmount) {
      bill.status = 'paid';
      bill.paidAt = new Date().toISOString();
      bill.paymentId = payment.Id;
    } else {
      bill.status = 'partially_paid';
      bill.partialPayments = (bill.partialPayments || []).concat(payment.Id);
    }

    bill.updatedAt = new Date().toISOString();

    return { ...payment };
  }

  // Payment Proof Management
  async uploadPaymentProof(paymentId, proofData) {
    await this.delay(600);
    
    if (!this.validateFinanceManagerRole()) {
      throw new Error('Insufficient permissions. Finance manager role required.');
    }

    const payment = this.vendorPayments.find(p => p.Id === paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Simulate file upload validation
    if (!proofData.fileName || !proofData.fileType || !proofData.fileSize) {
      throw new Error('Invalid proof file data');
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(proofData.fileType)) {
      throw new Error('Only JPEG, PNG, and PDF files are allowed');
    }

    if (proofData.fileSize > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('File size must be less than 5MB');
    }

    const proof = {
      Id: this.getNextProofId(),
      paymentId: paymentId,
      fileName: proofData.fileName,
      fileType: proofData.fileType,
      fileSize: proofData.fileSize,
      fileUrl: this.generateFileUrl(proofData.fileName), // Simulated URL
      uploadedAt: new Date().toISOString(),
      uploadedBy: this.currentUserRole,
      status: 'pending_verification',
      verificationNotes: ''
    };

    this.paymentProofs.push(proof);

    // Update payment status
    payment.proofStatus = 'uploaded';
    payment.proofId = proof.Id;
    payment.updatedAt = new Date().toISOString();

    return { ...proof };
  }

  async verifyPaymentProof(proofId, verificationData) {
    await this.delay(400);
    
    if (!this.validateFinanceManagerRole()) {
      throw new Error('Insufficient permissions. Finance manager role required.');
    }

    const proof = this.paymentProofs.find(p => p.Id === proofId);
    if (!proof) {
      throw new Error('Payment proof not found');
    }

    const payment = this.vendorPayments.find(p => p.Id === proof.paymentId);
    if (!payment) {
      throw new Error('Associated payment not found');
    }

    // Simulate verification process
    const verified = verificationData.approved !== false; // Default to approved unless explicitly false

    proof.status = verified ? 'verified' : 'rejected';
    proof.verifiedAt = new Date().toISOString();
    proof.verifiedBy = this.currentUserRole;
    proof.verificationNotes = verificationData.notes || '';

    if (verified) {
      payment.status = 'completed';
      payment.proofStatus = 'verified';
      payment.completedAt = new Date().toISOString();

      // Update vendor totals
      const vendor = this.vendors.find(v => v.Id === payment.vendorId);
      if (vendor) {
        vendor.totalPaid += payment.amount;
        vendor.totalOwed -= payment.amount;
        vendor.lastPaymentDate = new Date().toISOString();
        vendor.updatedAt = new Date().toISOString();
      }
    } else {
      payment.status = 'proof_rejected';
      payment.proofStatus = 'rejected';
      payment.rejectedAt = new Date().toISOString();
    }

    payment.updatedAt = new Date().toISOString();

    return { 
      verified, 
      proof: { ...proof }, 
      payment: { ...payment } 
    };
  }

  // Finance Manager Role Validation
  validateFinanceManagerRole() {
    return this.currentUserRole === 'admin' || this.currentUserRole === this.financeManagerRole;
  }

  async setUserRole(role) {
    await this.delay(100);
    this.currentUserRole = role;
    return { role };
  }

  async getCurrentUserRole() {
    await this.delay(100);
    return { role: this.currentUserRole };
  }

  // Reporting and Analytics
  async getVendorPaymentSummary(vendorId) {
    await this.delay(400);
    
    const vendor = this.vendors.find(v => v.Id === vendorId);
    if (!vendor) {
      throw new Error('Vendor not found');
    }

    const bills = this.vendorBills.filter(b => b.vendorId === vendorId);
    const payments = this.vendorPayments.filter(p => p.vendorId === vendorId);

    const summary = {
      vendor: { ...vendor },
      totalBills: bills.length,
      totalBillAmount: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
      paidBills: bills.filter(b => b.status === 'paid').length,
      pendingBills: bills.filter(b => b.status === 'pending').length,
      overdueBills: bills.filter(b => 
        b.status === 'pending' && new Date(b.dueDate) < new Date()
      ).length,
      totalPayments: payments.length,
      completedPayments: payments.filter(p => p.status === 'completed').length,
      pendingPayments: payments.filter(p => p.status === 'pending_proof').length,
      rejectedPayments: payments.filter(p => p.status === 'proof_rejected').length
    };

    return summary;
  }

  async getVendorPaymentHistory(vendorId, limit = 50) {
    await this.delay(300);
    
    const payments = this.vendorPayments
      .filter(p => p.vendorId === vendorId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return payments.map(payment => ({ ...payment }));
  }

  async getPendingVendorBills() {
    await this.delay(300);
    
    const pendingBills = this.vendorBills
      .filter(bill => bill.status === 'pending')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return pendingBills.map(bill => ({ ...bill }));
  }

  async getOverdueBills() {
    await this.delay(300);
    
    const today = new Date();
    const overdueBills = this.vendorBills
      .filter(bill => bill.status === 'pending' && new Date(bill.dueDate) < today)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return overdueBills.map(bill => ({ ...bill }));
  }

  async getPaymentProofQueue() {
    await this.delay(300);
    
    const pendingProofs = this.paymentProofs
      .filter(proof => proof.status === 'pending_verification')
      .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));

    return pendingProofs.map(proof => ({ ...proof }));
  }

  // Utility Methods for Vendor System
  getNextVendorId() {
    const maxId = this.vendors.reduce((max, vendor) => 
      vendor.Id > max ? vendor.Id : max, 0);
    return maxId + 1;
  }

  getNextBillId() {
    const maxId = this.vendorBills.reduce((max, bill) => 
      bill.Id > max ? bill.Id : max, 0);
    return maxId + 1;
  }

  getNextPaymentId() {
    const maxId = this.vendorPayments.reduce((max, payment) => 
      payment.Id > max ? payment.Id : max, 0);
    return maxId + 1;
  }

  getNextProofId() {
    const maxId = this.paymentProofs.reduce((max, proof) => 
      proof.Id > max ? proof.Id : max, 0);
    return maxId + 1;
  }

  generateBillNumber() {
    return 'BILL-' + Date.now().toString().slice(-8);
  }

  calculateDueDate(paymentTerms) {
    const days = parseInt(paymentTerms.replace(/\D/g, '')) || 30;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString();
  }

  generateFileUrl(fileName) {
    // Simulate file URL generation
    return `https://storage.example.com/proofs/${Date.now()}-${fileName}`;
  }
}

export const paymentService = new PaymentService();