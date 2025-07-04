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
        change: paymentType === 'cash' ? getChange() : 0
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
      
      toast.success('Payment processed successfully!');
      
      // Print receipt (in real app, this would trigger printer)
      printReceipt(transactionData);

    } catch (err) {
      toast.error('Payment processing failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  const printReceipt = (transaction) => {
    const receiptWindow = window.open('', '_blank');
    const receipt = `
      <html>
        <head><title>Receipt</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>FreshMart Receipt</h2>
          <p>Date: ${new Date().toLocaleString()}</p>
          <hr>
          ${transaction.items.map(item => `
            <div>${item.name} x${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString()}</div>
          `).join('')}
          <hr>
          <p><strong>Total: Rs. ${transaction.total.toLocaleString()}</strong></p>
          ${transaction.paymentType === 'cash' ? `
            <p>Paid: Rs. ${transaction.customerPaid.toLocaleString()}</p>
            <p>Change: Rs. ${transaction.change.toLocaleString()}</p>
          ` : ''}
          <p>Payment: ${transaction.paymentType}</p>
          <hr>
          <p>Thank you for shopping with FreshMart!</p>
        </body>
      </html>
    `;
    receiptWindow.document.write(receipt);
    receiptWindow.document.close();
    receiptWindow.print();
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
                        <option value="card">Card</option>
                        <option value="digital">Digital Payment</option>
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
    </div>
  );
};

export default POS;