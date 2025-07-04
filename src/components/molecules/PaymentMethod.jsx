import React, { useState } from 'react';
import ApperIcon from '@/components/ApperIcon';

const PaymentMethod = ({ selectedMethod, onMethodChange, showCardForm = false, onCardDataChange }) => {
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const paymentMethods = [
    {
      id: 'cash',
      name: 'Cash on Delivery',
      icon: 'Banknote',
      description: 'Pay when you receive your order',
      color: 'bg-gradient-to-r from-gray-500 to-gray-600',
      badge: 'Most Popular',
      fee: 'Free'
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: 'CreditCard',
      description: 'Visa, Mastercard, American Express',
      color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
      badge: 'Secure',
      fee: 'Free'
    },
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: 'Smartphone',
      description: 'Mobile wallet payment',
      color: 'bg-gradient-to-r from-orange-500 to-red-500',
      badge: 'Instant',
      fee: '1% + Rs. 5'
    },
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      icon: 'Smartphone',
      description: 'Mobile wallet payment',
      color: 'bg-gradient-to-r from-green-500 to-blue-500',
      badge: 'Instant',
      fee: '1% + Rs. 5'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: 'Building2',
      description: 'Direct bank transfer',
      color: 'bg-gradient-to-r from-blue-500 to-purple-500',
      badge: 'Secure',
      fee: 'Rs. 20'
    },
    {
      id: 'sadapay',
      name: 'SadaPay',
      icon: 'Wallet',
      description: 'Digital wallet',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      badge: 'New',
      fee: 'Free'
    }
  ];

  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number with spaces
    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      formattedValue = formattedValue.match(/.{1,4}/g)?.join(' ') || formattedValue;
      if (formattedValue.length > 19) formattedValue = formattedValue.substr(0, 19);
    }

    // Format expiry date with slash
    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.substr(0, 2) + '/' + formattedValue.substr(2, 2);
      }
      if (formattedValue.length > 5) formattedValue = formattedValue.substr(0, 5);
    }

    // Format CVV (numbers only)
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substr(0, 4);
    }

    const updatedCardData = { ...cardData, [name]: formattedValue };
    setCardData(updatedCardData);
    
    if (onCardDataChange) {
      onCardDataChange(updatedCardData);
    }
  };

return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Payment Method</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className={`
              relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedMethod === method.id
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
            `}
            onClick={() => onMethodChange(method.id)}
          >
            {/* Badge */}
            {method.badge && (
              <div className="absolute -top-2 -right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                {method.badge}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <div className={`${method.color} p-3 rounded-lg`}>
                <ApperIcon name={method.icon} size={24} className="text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{method.name}</h4>
                  <span className="text-xs text-gray-500">{method.fee}</span>
                </div>
                <p className="text-sm text-gray-500">{method.description}</p>
              </div>
              
              <div className={`
                w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selectedMethod === method.id
                  ? 'border-primary bg-primary'
                  : 'border-gray-300'
                }
              `}>
                {selectedMethod === method.id && (
                  <ApperIcon name="Check" size={12} className="text-white" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card Form */}
      {selectedMethod === 'card' && showCardForm && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900 mb-4">Card Details</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Number
              </label>
              <input
                type="text"
                name="cardNumber"
                value={cardData.cardNumber}
                onChange={handleCardInputChange}
                placeholder="1234 5678 9012 3456"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="text"
                name="expiryDate"
                value={cardData.expiryDate}
                onChange={handleCardInputChange}
                placeholder="MM/YY"
                className="input-field"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CVV
              </label>
              <input
                type="text"
                name="cvv"
                value={cardData.cvv}
                onChange={handleCardInputChange}
                placeholder="123"
                className="input-field"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cardholder Name
              </label>
              <input
                type="text"
                name="cardholderName"
                value={cardData.cardholderName}
                onChange={handleCardInputChange}
                placeholder="John Doe"
                className="input-field"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ApperIcon name="Shield" size={16} className="text-green-500" />
            <span>Your card details are encrypted and secure</span>
          </div>
        </div>
      )}

      {/* Payment Instructions */}
      {['jazzcash', 'easypaisa', 'bank'].includes(selectedMethod) && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <ApperIcon name="Info" size={16} className="text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Payment Instructions:</p>
              <p>
                {selectedMethod === 'jazzcash' && 'Send payment to JazzCash: 03XX-XXXXXXX and upload transaction screenshot.'}
                {selectedMethod === 'easypaisa' && 'Send payment to EasyPaisa: 03XX-XXXXXXX and upload transaction screenshot.'}
                {selectedMethod === 'bank' && 'Transfer to Bank Account: XXXX-XXXX-XXXX and upload transaction receipt.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethod;