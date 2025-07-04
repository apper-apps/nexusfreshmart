import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import CartItem from '@/components/molecules/CartItem';
import Empty from '@/components/ui/Empty';
import { useCart } from '@/hooks/useCart';

const Cart = () => {
  const navigate = useNavigate();
  const { cart, getCartTotal, getCartCount, clearCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Empty 
          type="cart" 
          onAction={() => navigate('/category/All')}
        />
      </div>
    );
  }

  const subtotal = getCartTotal();
  const deliveryCharge = 150; // Fixed delivery charge
  const total = subtotal + deliveryCharge;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Shopping Cart ({getCartCount()} items)
        </h1>
        
        <button
          onClick={clearCart}
          className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
        >
          <ApperIcon name="Trash2" size={20} />
          <span>Clear Cart</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <CartItem key={item.id} item={item} />
          ))}
          
          {/* Continue Shopping */}
          <div className="border-t border-gray-200 pt-4">
            <Link 
              to="/category/All"
              className="inline-flex items-center space-x-2 text-primary hover:text-primary-dark transition-colors"
            >
              <ApperIcon name="ArrowLeft" size={20} />
              <span>Continue Shopping</span>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">Rs. {subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Charge</span>
                <span className="font-medium">Rs. {deliveryCharge.toLocaleString()}</span>
              </div>
              
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold gradient-text">
                    Rs. {total.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="large"
              icon="CreditCard"
              onClick={() => navigate('/checkout')}
              className="w-full mb-4"
            >
              Proceed to Checkout
            </Button>

            {/* Trust Badges */}
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ApperIcon name="Shield" size={16} className="text-green-600" />
                <span>Secure checkout</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ApperIcon name="Truck" size={16} className="text-blue-600" />
                <span>Fast delivery</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ApperIcon name="RotateCcw" size={16} className="text-purple-600" />
                <span>Easy returns</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">We accept:</p>
              <div className="flex space-x-2">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded">
                  JazzCash
                </div>
                <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs px-2 py-1 rounded">
                  EasyPaisa
                </div>
                <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs px-2 py-1 rounded">
                  COD
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;