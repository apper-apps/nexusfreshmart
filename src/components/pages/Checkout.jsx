import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import PaymentMethod from '@/components/molecules/PaymentMethod';
import { useCart } from '@/hooks/useCart';
import { orderService } from '@/services/api/orderService';

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    instructions: ''
  });

  const subtotal = getCartTotal();
  const deliveryCharge = 150;
  const total = subtotal + deliveryCharge;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaymentProof(file);
    }
  };

  const validateForm = () => {
    const required = ['name', 'phone', 'address', 'city'];
    const missing = required.filter(field => !formData[field].trim());
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`);
      return false;
    }
    
    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return false;
    }
    
    if (['jazzcash', 'easypaisa', 'bank'].includes(paymentMethod) && !paymentProof) {
      toast.error('Please upload payment proof');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit
        })),
        total: total,
        deliveryCharge: deliveryCharge,
        paymentMethod: paymentMethod,
        paymentProof: paymentProof ? {
          fileName: paymentProof.name,
          fileSize: paymentProof.size,
          uploadedAt: new Date().toISOString()
        } : null,
        deliveryAddress: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          instructions: formData.instructions
        },
        status: 'pending'
      };

      const order = await orderService.create(orderData);
      
      // Clear cart
      clearCart();
      
      toast.success('Order placed successfully!');
      navigate(`/orders/${order.id}`);
      
    } catch (error) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Checkout Form */}
        <div className="space-y-8">
          {/* Delivery Information */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                icon="User"
              />
              
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
                icon="Phone"
              />
              
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                icon="Mail"
              />
              
              <Input
                label="City"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                required
                icon="MapPin"
              />
            </div>
            
            <div className="mt-4">
              <Input
                label="Delivery Address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
                icon="Home"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Input
                label="Postal Code"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleInputChange}
                icon="Hash"
              />
              
              <Input
                label="Delivery Instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                placeholder="Optional"
                icon="MessageSquare"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="card p-6">
            <PaymentMethod
              selectedMethod={paymentMethod}
              onMethodChange={setPaymentMethod}
            />
            
            {/* Payment Proof Upload */}
            {['jazzcash', 'easypaisa', 'bank'].includes(paymentMethod) && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Upload Payment Proof</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload a screenshot of your payment transaction along with your transaction ID.
                </p>
                
                <div className="space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/80"
                  />
                  
                  {paymentProof && (
                    <div className="flex items-center space-x-2 text-sm text-green-600">
                      <ApperIcon name="Check" size={16} />
                      <span>File uploaded: {paymentProof.name}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Summary */}
        <div className="card p-6 h-fit sticky top-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
          
          {/* Items */}
          <div className="space-y-3 mb-6">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">
                    {item.quantity} x Rs. {item.price.toLocaleString()}
                  </p>
                </div>
                <p className="font-medium">
                  Rs. {(item.quantity * item.price).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          
          {/* Totals */}
          <div className="space-y-2 mb-6 pb-4 border-t border-gray-200 pt-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Charge</span>
              <span className="font-medium">Rs. {deliveryCharge.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center border-t border-gray-200 pt-2">
              <span className="text-xl font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold gradient-text">
                Rs. {total.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Place Order Button */}
          <Button
            variant="primary"
            size="large"
            icon="CreditCard"
            onClick={handleSubmit}
            loading={loading}
            className="w-full"
          >
            Place Order
          </Button>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            By placing this order, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;