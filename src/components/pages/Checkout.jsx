import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCart } from "@/hooks/useCart";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Error from "@/components/ui/Error";
import PaymentMethod from "@/components/molecules/PaymentMethod";
import { orderService } from "@/services/api/orderService";
import { paymentService } from "@/services/api/paymentService";

function Checkout() {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    instructions: ''
  })
  const [paymentProof, setPaymentProof] = useState(null)
  const [errors, setErrors] = useState({})

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const deliveryCharge = 150
  const total = subtotal + deliveryCharge

  function handleInputChange(e) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG)')
        return
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB')
        return
      }
      setPaymentProof(file)
    }
  }

  function validateForm() {
    const newErrors = {}
    const required = ['name', 'phone', 'address', 'city', 'postalCode']
    
    required.forEach(field => {
      if (!formData[field]?.trim()) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      }
    })

    // Validate phone number
    if (formData.phone && !/^03[0-9]{9}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid Pakistani phone number (03XXXXXXXXX)'
    }

    // Validate email if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    // Validate payment proof for bank transfer
    if (paymentMethod === 'bank' && !paymentProof) {
      newErrors.paymentProof = 'Payment proof is required for bank transfer'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handlePaymentRetry() {
    try {
      setLoading(true)
      const paymentResult = await paymentService.retryPayment(
        'previous_transaction_id',
        { amount: total, orderId: Date.now() }
      )
      return paymentResult
    } catch (error) {
      toast.error('Payment retry failed: ' + error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  async function handlePaymentVerification(transactionId) {
    try {
      const verificationResult = await paymentService.verifyPayment(transactionId, {
        amount: total,
        orderId: Date.now()
      })
      return verificationResult
    } catch (error) {
      toast.error('Payment verification failed: ' + error.message)
      throw error
    }
  }
// Convert file to base64 for safe serialization
  async function convertFileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  async function completeOrder(paymentResult) {
    try {
      let paymentProofData = null
      
      // Safely convert file to base64 if payment proof exists
      if (paymentProof) {
        try {
          paymentProofData = await convertFileToBase64(paymentProof)
        } catch (fileError) {
          console.warn('Failed to convert payment proof to base64:', fileError)
          toast.warn('Payment proof could not be processed, but order will continue')
        }
      }

      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        total,
        deliveryCharge,
        paymentMethod,
        paymentResult,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'completed',
        paymentProof: paymentProofData,
        paymentProofFileName: paymentProof?.name || null,
        deliveryAddress: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          instructions: formData.instructions
        },
        status: paymentMethod === 'cash' ? 'confirmed' : 'payment_pending'
      }

      const order = await orderService.create(orderData)
      clearCart()
      toast.success('Order placed successfully!')
      navigate('/orders')
      return order
    } catch (error) {
      toast.error('Failed to create order: ' + error.message)
      throw error
    }
  }
  async function handleSubmit(e, isRetry = false) {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors')
      return
    }

    try {
      setLoading(true)
      let paymentResult = null

      // Process payment based on method
      if (paymentMethod === 'card') {
        paymentResult = await paymentService.processCardPayment(
          { number: '4111111111111111', cvv: '123', expiry: '12/25' },
          total,
          Date.now()
        )
      } else if (paymentMethod === 'wallet') {
        paymentResult = await paymentService.processWalletPayment(total, Date.now())
      } else if (paymentMethod === 'bank') {
        paymentResult = await paymentService.processBankTransfer(
          total,
          Date.now(),
          { accountNumber: '1234567890', bankName: 'Test Bank' }
        )
        
        // Handle verification if required
        if (paymentResult.requiresVerification) {
          const verificationResult = await handlePaymentVerification(paymentResult.transactionId)
          if (!verificationResult.verified) {
            throw new Error('Payment verification failed')
          }
        }
      }

      // Complete the order
      await completeOrder(paymentResult)
      
    } catch (error) {
      console.error('Order submission error:', error)
      toast.error('Order failed: ' + error.message)
      
      // Offer retry for payment failures
      if (error.message.includes('payment') && !isRetry) {
        setTimeout(() => {
          if (window.confirm('Payment failed. Would you like to retry?')) {
            handleSubmit(e, true)
          }
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  // Redirect if cart is empty
  if (cart.length === 0) {
    navigate('/cart')
    return null
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center mb-8">
          <ApperIcon className="h-8 w-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div className="order-2 lg:order-1">
            <div className="card p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded mr-3"
                      />
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-semibold">
                      PKR {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>PKR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    <span>PKR {deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold border-t pt-2">
                    <span>Total:</span>
                    <span>PKR {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="order-1 lg:order-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Delivery Information */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Delivery Information</h2>
                <div className="space-y-4">
                  <div>
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      error={errors.name}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      error={errors.phone}
                      placeholder="03XXXXXXXXX"
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      error={errors.email}
                    />
                  </div>
                  <div>
                    <Input
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      error={errors.address}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="City"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      error={errors.city}
                      required
                    />
                    <Input
                      label="Postal Code"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      error={errors.postalCode}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Delivery Instructions"
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      placeholder="Special instructions for delivery..."
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <PaymentMethod
                  selected={paymentMethod}
                  onSelect={setPaymentMethod}
                />
                
                {paymentMethod === 'bank' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Payment Proof
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90"
                    />
                    {errors.paymentProof && (
                      <p className="mt-1 text-sm text-red-600">{errors.paymentProof}</p>
                    )}
                    {paymentProof && (
                      <p className="mt-2 text-sm text-green-600">
                        File uploaded: {paymentProof.name}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="card p-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Processing...' : `Place Order - PKR ${total.toFixed(2)}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
</div>
    </div>
  )
}

export default Checkout