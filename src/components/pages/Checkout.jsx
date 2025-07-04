import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "@/hooks/useCart";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import PaymentMethod from "@/components/molecules/PaymentMethod";
import { orderService } from "@/services/api/orderService";
import { paymentService } from "@/services/api/paymentService";

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [cardData, setCardData] = useState({});
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentRetryCount, setPaymentRetryCount] = useState(0);
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState(null);
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

  const handlePaymentRetry = async () => {
    if (paymentRetryCount >= 3) {
      toast.error('Maximum retry attempts reached. Please try a different payment method.');
      return;
    }
    
    setPaymentRetryCount(prev => prev + 1);
    await handleSubmit(null, true);
  };

  const handlePaymentVerification = async (transactionId) => {
    try {
      setProcessingPayment(true);
      const verificationResult = await paymentService.verifyPayment(transactionId, {
        paymentProof: paymentProof,
        customerPhone: formData.phone
      });
      
      if (verificationResult.verified) {
        toast.success('Payment verified successfully!');
        setVerificationRequired(false);
        // Continue with order creation
        await completeOrder(verificationResult.transaction);
      } else {
        toast.error('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      toast.error('Verification failed: ' + error.message);
    } finally {
      setProcessingPayment(false);
    }
  };

  const completeOrder = async (paymentResult) => {
    try {
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
        paymentResult: paymentResult,
        paymentStatus: paymentResult?.status || 'pending',
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
        status: paymentMethod === 'cash' ? 'pending' : 'confirmed'
      };

      const order = await orderService.create(orderData);
      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${order.Id}`);
    } catch (error) {
      toast.error('Failed to create order: ' + error.message);
    }
  };

  const handleSubmit = async (e, isRetry = false) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) return;
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      setLoading(true);
      setProcessingPayment(true);
      
      let paymentResult = null;
      
      // Process payment if not cash on delivery
      if (paymentMethod !== 'cash') {
        try {
          if (paymentMethod === 'card') {
            if (!cardData.cardNumber || !cardData.expiryDate || !cardData.cvv || !cardData.cardholderName) {
              toast.error('Please fill in all card details');
              return;
            }
            paymentResult = await paymentService.processCardPayment(cardData, total, `ORDER-${Date.now()}`);
          } else if (['jazzcash', 'easypaisa', 'sadapay'].includes(paymentMethod)) {
            paymentResult = await paymentService.processDigitalWalletPayment(paymentMethod, total, `ORDER-${Date.now()}`, formData.phone);
          } else if (paymentMethod === 'bank') {
            paymentResult = await paymentService.processBankTransfer(total, `ORDER-${Date.now()}`, {});
            
            // Bank transfers require verification
            if (paymentResult.requiresVerification) {
              setVerificationRequired(true);
              setPendingTransaction(paymentResult);
              toast.info('Payment submitted for verification. Please upload your payment proof.');
              return;
            }
          } else if (paymentMethod === 'wallet') {
            paymentResult = await paymentService.processWalletPayment(total, `ORDER-${Date.now()}`);
          }
          
          toast.success('Payment processed successfully!');
          
          // Complete order creation
          await completeOrder(paymentResult);
          
        } catch (paymentError) {
          console.error('Payment error:', paymentError);
          
          if (paymentError.message.includes('insufficient') || 
              paymentError.message.includes('declined') || 
              paymentError.message.includes('failed')) {
            toast.error(paymentError.message);
            
            // Offer retry for certain errors
            if (!isRetry && paymentRetryCount < 3) {
              toast.info('Would you like to retry the payment?');
            }
          } else {
            toast.error('Payment failed: ' + paymentError.message);
          }
          return;
        }
      } else {
        // Cash on delivery - directly create order
        await completeOrder(null);
      }
      
    } catch (error) {
      console.error('Order creation error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
setProcessingPayment(false);
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
              showCardForm={paymentMethod === 'card'}
              onCardDataChange={setCardData}
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
            
            {/* Payment Verification Section */}
            {verificationRequired && pendingTransaction && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <ApperIcon name="Clock" size={20} className="text-blue-600" />
                  <h4 className="font-medium text-blue-900">Payment Verification Required</h4>
                </div>
                <p className="text-sm text-blue-700 mb-4">
                  Your payment has been submitted for verification. Please upload your payment proof to complete the order.
                </p>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Transaction ID:</strong> {pendingTransaction.transactionId}
                  </div>
                  <div className="text-sm">
                    <strong>Amount:</strong> Rs. {total.toLocaleString()}
                  </div>
                  <Button
                    variant="primary"
                    size="small"
                    onClick={() => handlePaymentVerification(pendingTransaction.transactionId)}
                    loading={processingPayment}
                    disabled={!paymentProof}
                  >
                    Verify Payment
                  </Button>
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
          <div className="space-y-3">
            <Button
              variant="primary"
              size="large"
              icon="CreditCard"
              onClick={handleSubmit}
              loading={loading || processingPayment}
              disabled={verificationRequired}
              className="w-full"
            >
              {processingPayment ? 'Processing Payment...' : 
               verificationRequired ? 'Payment Verification Required' : 'Place Order'}
            </Button>
            
            {/* Retry Button */}
            {paymentRetryCount > 0 && paymentRetryCount < 3 && !processingPayment && (
              <Button
                variant="secondary"
                size="large"
                icon="RotateCcw"
                onClick={handlePaymentRetry}
                className="w-full"
              >
                Retry Payment ({3 - paymentRetryCount} attempts left)
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-3 text-center">
            By placing this order, you agree to our terms and conditions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Checkout;