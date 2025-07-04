import React from 'react';
import ApperIcon from '@/components/ApperIcon';

const PaymentMethod = ({ selectedMethod, onMethodChange }) => {
  const paymentMethods = [
    {
      id: 'jazzcash',
      name: 'JazzCash',
      icon: 'Smartphone',
      description: 'Mobile wallet payment',
      color: 'bg-gradient-to-r from-orange-500 to-red-500'
    },
    {
      id: 'easypaisa',
      name: 'EasyPaisa',
      icon: 'Smartphone',
      description: 'Mobile wallet payment',
      color: 'bg-gradient-to-r from-green-500 to-blue-500'
    },
    {
      id: 'bank',
      name: 'Bank Transfer',
      icon: 'Building2',
      description: 'Direct bank transfer',
      color: 'bg-gradient-to-r from-blue-500 to-purple-500'
    },
    {
      id: 'cash',
      name: 'Cash on Delivery',
      icon: 'Banknote',
      description: 'Pay when you receive',
      color: 'bg-gradient-to-r from-gray-500 to-gray-600'
    }
  ];

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
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => onMethodChange(method.id)}
          >
            <div className="flex items-center space-x-3">
              <div className={`${method.color} p-2 rounded-lg`}>
                <ApperIcon name={method.icon} size={24} className="text-white" />
              </div>
              
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{method.name}</h4>
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
    </div>
  );
};

export default PaymentMethod;