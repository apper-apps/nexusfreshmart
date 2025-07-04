import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import SearchBar from '@/components/molecules/SearchBar';
import BarcodeScanner from '@/components/molecules/BarcodeScanner';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import { productService } from '@/services/api/productService';
import { posService } from '@/services/api/posService';
import { paymentService } from '@/services/api/paymentService';
const POS = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentType, setPaymentType] = useState('cash');
  const [customerPaid, setCustomerPaid] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  
  // Receipt configuration state
  const [receiptConfig, setReceiptConfig] = useState({
    storeName: 'FreshMart',
    storeAddress: '123 Main Street, City, State 12345',
    storePhone: '(555) 123-4567',
    storeEmail: 'info@freshmart.com',
    footerMessage: 'Thank you for shopping with FreshMart!',
    showLogo: true,
    receiptFormat: 'standard', // 'thermal' or 'standard'
    autoPrint: true,
    includeBarcode: true
  });
  
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const [showReceiptConfig, setShowReceiptConfig] = useState(false);
  const [previewTransaction, setPreviewTransaction] = useState(null);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [printStatus, setPrintStatus] = useState('');
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data.filter(p => p.isActive && p.stock > 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

const filterProducts = () => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products.slice(0, 20)); // Show first 20 products
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchTerm))
    );
    setFilteredProducts(filtered);
  };

  const handleBarcodeScan = async (barcode) => {
    try {
      const product = await productService.getByBarcode(barcode);
      if (product) {
        addToCart(product);
        toast.success(`${product.name} added to cart`);
      } else {
        toast.error('Product not found');
      }
    } catch (err) {
      toast.error('Error finding product');
    }
    setShowBarcodeScanner(false);
  };

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.error('Insufficient stock');
        return;
      }
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    if (newQuantity > product.stock) {
      toast.error('Insufficient stock');
      return;
    }

    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getChange = () => {
    const total = getTotal();
    const paid = parseFloat(customerPaid) || 0;
    return Math.max(0, paid - total);
  };

const processPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const total = getTotal();
    const paid = parseFloat(customerPaid) || 0;

    if (paymentType === 'cash' && paid < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    try {
      setProcessingPayment(true);

      // Process payment based on payment type
      let paymentResult = null;
      
      if (paymentType !== 'cash') {
        try {
          if (paymentType === 'card') {
            // For POS, we'll simulate card payment without form
            const mockCardData = {
              cardNumber: '4*** **** **** ****',
              expiryDate: '12/25',
              cvv: '***',
              cardholderName: 'Customer'
            };
            paymentResult = await paymentService.processCardPayment(mockCardData, total, `POS-${Date.now()}`);
          } else if (['jazzcash', 'easypaisa', 'sadapay'].includes(paymentType)) {
            paymentResult = await paymentService.processDigitalWalletPayment(paymentType, total, `POS-${Date.now()}`, '03001234567');
          } else if (paymentType === 'bank') {
            paymentResult = await paymentService.processBankTransfer(total, `POS-${Date.now()}`, {});
          }
        } catch (paymentError) {
          toast.error(paymentError.message);
          setProcessingPayment(false);
          return;
        }
      }

      const transactionData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total,
        paymentType,
        cashierId: 'admin', // In real app, this would be the logged-in user
        customerPaid: paymentType === 'cash' ? paid : total,
        change: paymentType === 'cash' ? getChange() : 0,
        paymentResult: paymentResult || null
      };

      await posService.createTransaction(transactionData);

      // Update product stock
      for (const item of cart) {
        const product = products.find(p => p.id === item.id);
        await productService.update(item.id, {
          ...product,
          stock: product.stock - item.quantity
        });
      }

      // Reset
      setCart([]);
      setCustomerPaid('');
      await loadProducts();
      
      if (paymentType === 'cash') {
        toast.success('Payment processed successfully!');
      } else {
        toast.success(`${paymentType.toUpperCase()} payment processed successfully!`);
      }
      
      // Handle receipt printing based on configuration
      if (receiptConfig.autoPrint) {
        printReceipt(transactionData);
      } else {
        showReceiptPreviewModal(transactionData);
      }

    } catch (err) {
      toast.error('Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

const generateReceiptHTML = (transaction) => {
    const receiptNumber = `RCP-${Date.now()}`;
    const currentDate = new Date().toLocaleString();
    
    const receiptStyles = receiptConfig.receiptFormat === 'thermal' ? `
      <style>
        @media print {
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          body { 
            font-size: 12px; 
            line-height: 1.3; 
            margin: 0; 
            padding: 5mm; 
          }
        }
        body { 
          font-family: 'Courier New', monospace; 
          width: 72mm; 
          margin: 0 auto; 
          padding: 10px; 
          background: white; 
        }
        .header { text-align: center; margin-bottom: 10px; }
        .store-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .store-info { font-size: 10px; line-height: 1.2; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .item-row { display: flex; justify-content: space-between; margin: 2px 0; }
        .item-name { flex: 1; }
        .item-price { text-align: right; }
        .total-section { margin-top: 10px; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        .receipt-number { font-size: 10px; text-align: center; margin-top: 5px; }
      </style>
    ` : `
      <style>
        @media print {
          @page { 
            size: A4; 
            margin: 15mm; 
          }
          body { 
            font-size: 14px; 
            line-height: 1.4; 
          }
        }
        body { 
          font-family: Arial, sans-serif; 
          max-width: 400px; 
          margin: 0 auto; 
          padding: 20px; 
          background: white; 
        }
        .header { text-align: center; margin-bottom: 20px; }
        .store-name { font-size: 24px; font-weight: bold; color: #2E7D32; margin-bottom: 10px; }
        .store-info { font-size: 12px; color: #666; line-height: 1.3; }
        .divider { border-top: 2px solid #2E7D32; margin: 15px 0; }
        .transaction-info { margin-bottom: 15px; }
        .item-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #eee; }
        .item-details { flex: 1; }
        .item-name { font-weight: 500; }
        .item-subtitle { font-size: 12px; color: #666; }
        .item-price { font-weight: bold; color: #2E7D32; }
        .total-section { margin-top: 20px; padding-top: 15px; border-top: 2px solid #2E7D32; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; }
        .final-total { font-size: 18px; font-weight: bold; color: #2E7D32; }
        .footer { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; }
        .footer-message { font-style: italic; color: #666; }
        .receipt-number { font-size: 10px; color: #999; margin-top: 10px; }
      </style>
    `;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${receiptNumber}</title>
          <meta charset="UTF-8">
          ${receiptStyles}
        </head>
        <body>
          <div class="header">
            <div class="store-name">${receiptConfig.storeName}</div>
            <div class="store-info">
              ${receiptConfig.storeAddress}<br>
              ${receiptConfig.storePhone}<br>
              ${receiptConfig.storeEmail}
            </div>
          </div>

          <div class="divider"></div>

          <div class="transaction-info">
            <div>Receipt #: ${receiptNumber}</div>
            <div>Date: ${currentDate}</div>
            <div>Cashier: ${transaction.cashierId}</div>
            <div>Payment: ${transaction.paymentType.toUpperCase()}</div>
          </div>

          <div class="divider"></div>

          <div class="items-section">
            ${transaction.items.map(item => `
              <div class="item-row">
                <div class="item-details">
                  <div class="item-name">${item.name}</div>
                  <div class="item-subtitle">${item.quantity} x Rs. ${item.price.toLocaleString()}</div>
                </div>
                <div class="item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
              </div>
            `).join('')}
          </div>

          <div class="total-section">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rs. ${transaction.total.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>Tax (0%):</span>
              <span>Rs. 0</span>
            </div>
            <div class="total-row final-total">
              <span>Total:</span>
              <span>Rs. ${transaction.total.toLocaleString()}</span>
            </div>
            ${transaction.paymentType === 'cash' ? `
              <div class="total-row">
                <span>Paid:</span>
                <span>Rs. ${transaction.customerPaid.toLocaleString()}</span>
              </div>
              <div class="total-row">
                <span>Change:</span>
                <span>Rs. ${transaction.change.toLocaleString()}</span>
              </div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="footer-message">${receiptConfig.footerMessage}</div>
            <div class="receipt-number">Receipt #: ${receiptNumber}</div>
          </div>
        </body>
      </html>
    `;
  };

  const printReceipt = (transaction) => {
    try {
      setPrintStatus('Preparing receipt...');
      
      const receiptHTML = generateReceiptHTML(transaction);
      const receiptWindow = window.open('', '_blank', 'width=400,height=600');
      
      if (!receiptWindow) {
        toast.error('Please allow pop-ups to print receipts');
        setPrintStatus('');
        return;
      }

      receiptWindow.document.write(receiptHTML);
      receiptWindow.document.close();
      
      receiptWindow.onload = () => {
        setPrintStatus('Printing...');
        setTimeout(() => {
          receiptWindow.print();
          setPrintStatus('');
          toast.success('Receipt printed successfully');
        }, 500);
      };

      receiptWindow.onafterprint = () => {
        receiptWindow.close();
      };

      setLastTransaction(transaction);
      
    } catch (error) {
      setPrintStatus('');
      toast.error('Failed to print receipt');
      console.error('Print error:', error);
    }
  };

  const showReceiptPreviewModal = (transaction) => {
    setPreviewTransaction(transaction);
    setShowReceiptPreview(true);
  };

  const printFromPreview = () => {
    if (previewTransaction) {
      printReceipt(previewTransaction);
      setShowReceiptPreview(false);
    }
  };

  const reprintLastReceipt = () => {
    if (lastTransaction) {
      printReceipt(lastTransaction);
    } else {
      toast.error('No previous receipt to reprint');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading type="default" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Error message={error} onRetry={loadProducts} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">POS Terminal</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products Section */}
<div className="lg:col-span-2">
          <div className="card p-6">
            <div className="mb-6">
              <div className="flex space-x-2 mb-4">
                <div className="flex-1">
                  <SearchBar
                    onSearch={setSearchTerm}
                    placeholder="Search products or scan barcode..."
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowBarcodeScanner(true)}
                  icon="Scan"
                  className="whitespace-nowrap"
                >
                  Scan Barcode
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-3 hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  onClick={() => addToCart(product)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <h3 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-primary font-bold text-sm">
                    Rs. {product.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Stock: {product.stock}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Section */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Cart</h2>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ApperIcon name="ShoppingCart" size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select products to add to cart</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900">{item.name}</p>
                        <p className="text-xs text-gray-600">Rs. {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <ApperIcon name="Minus" size={14} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-1 rounded hover:bg-gray-200"
                        >
                          <ApperIcon name="Plus" size={14} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600"
                        >
                          <ApperIcon name="Trash2" size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold gradient-text">
                      Rs. {getTotal().toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
<select
                        value={paymentType}
                        onChange={(e) => setPaymentType(e.target.value)}
                        className="input-field"
                      >
                        <option value="cash">Cash</option>
                        <option value="card">Credit/Debit Card</option>
                        <option value="jazzcash">JazzCash</option>
                        <option value="easypaisa">EasyPaisa</option>
                        <option value="sadapay">SadaPay</option>
                        <option value="bank">Bank Transfer</option>
                      </select>
                    </div>

                    {paymentType === 'cash' && (
                      <div>
                        <Input
                          label="Customer Paid"
                          type="number"
                          step="0.01"
                          value={customerPaid}
                          onChange={(e) => setCustomerPaid(e.target.value)}
                          icon="Banknote"
                        />
                        {customerPaid && (
                          <div className="mt-2 text-sm">
                            <p className="text-gray-600">
                              Change: <span className="font-semibold text-green-600">
                                Rs. {getChange().toLocaleString()}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    )}
<div className="grid grid-cols-2 gap-2 mb-4">
                      <Button
                        variant="outline"
                        size="small"
                        icon="Settings"
                        onClick={() => setShowReceiptConfig(true)}
                      >
                        Receipt Config
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        icon="Printer"
                        onClick={reprintLastReceipt}
                        disabled={!lastTransaction}
                      >
                        Reprint Last
                      </Button>
                    </div>

                    <Button
                      variant="primary"
                      size="large"
                      icon="CreditCard"
                      onClick={processPayment}
                      loading={processingPayment}
                      className="w-full"
                    >
                      Process Payment
                    </Button>
                    
                    {printStatus && (
                      <div className="mt-2 text-sm text-center">
                        <span className="text-blue-600">{printStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
<BarcodeScanner
        isActive={showBarcodeScanner}
        onScan={handleBarcodeScan}
        onClose={() => setShowBarcodeScanner(false)}
      />

      {/* Receipt Preview Modal */}
      {showReceiptPreview && previewTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Receipt Preview</h3>
              <button
                onClick={() => setShowReceiptPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ApperIcon name="X" size={24} />
              </button>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
              <div className="text-center mb-4">
                <h4 className="text-xl font-bold text-primary">{receiptConfig.storeName}</h4>
                <p className="text-sm text-gray-600">{receiptConfig.storeAddress}</p>
                <p className="text-sm text-gray-600">{receiptConfig.storePhone}</p>
              </div>
              
              <div className="border-t border-gray-300 pt-3 mb-3">
                <p className="text-sm">Date: {new Date().toLocaleString()}</p>
                <p className="text-sm">Payment: {previewTransaction.paymentType.toUpperCase()}</p>
              </div>
              
              <div className="space-y-2 mb-3">
                {previewTransaction.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-gray-600">{item.quantity} x Rs. {item.price.toLocaleString()}</div>
                    </div>
                    <div className="font-medium">Rs. {(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              
              <div className="border-t border-gray-300 pt-3">
                <div className="flex justify-between font-bold text-lg text-primary">
                  <span>Total:</span>
                  <span>Rs. {previewTransaction.total.toLocaleString()}</span>
                </div>
                {previewTransaction.paymentType === 'cash' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Paid:</span>
                      <span>Rs. {previewTransaction.customerPaid.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Change:</span>
                      <span>Rs. {previewTransaction.change.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="text-center mt-4 pt-3 border-t border-gray-300">
                <p className="text-sm text-gray-600 italic">{receiptConfig.footerMessage}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowReceiptPreview(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={printFromPreview}
                icon="Printer"
                className="flex-1"
              >
                Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Configuration Modal */}
      {showReceiptConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Receipt Configuration</h3>
              <button
                onClick={() => setShowReceiptConfig(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <ApperIcon name="X" size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input
                label="Store Name"
                value={receiptConfig.storeName}
                onChange={(e) => setReceiptConfig({...receiptConfig, storeName: e.target.value})}
              />
              
              <Input
                label="Store Address"
                value={receiptConfig.storeAddress}
                onChange={(e) => setReceiptConfig({...receiptConfig, storeAddress: e.target.value})}
              />
              
              <Input
                label="Store Phone"
                value={receiptConfig.storePhone}
                onChange={(e) => setReceiptConfig({...receiptConfig, storePhone: e.target.value})}
              />
              
              <Input
                label="Store Email"
                value={receiptConfig.storeEmail}
                onChange={(e) => setReceiptConfig({...receiptConfig, storeEmail: e.target.value})}
              />
              
              <Input
                label="Footer Message"
                value={receiptConfig.footerMessage}
                onChange={(e) => setReceiptConfig({...receiptConfig, footerMessage: e.target.value})}
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt Format
                </label>
                <select
                  value={receiptConfig.receiptFormat}
                  onChange={(e) => setReceiptConfig({...receiptConfig, receiptFormat: e.target.value})}
                  className="input-field"
                >
                  <option value="standard">Standard (A4)</option>
                  <option value="thermal">Thermal (80mm)</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoPrint"
                  checked={receiptConfig.autoPrint}
                  onChange={(e) => setReceiptConfig({...receiptConfig, autoPrint: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="autoPrint" className="text-sm text-gray-700">
                  Auto-print receipts after payment
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowReceiptConfig(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowReceiptConfig(false);
                  toast.success('Receipt configuration saved');
                }}
                className="flex-1"
              >
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;