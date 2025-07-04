import React from 'react';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { useCart } from '@/hooks/useCart';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(item.id);
    } else {
      updateQuantity(item.id, newQuantity);
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <img
        src={item.imageUrl}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg"
      />
      
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{item.name}</h4>
        <p className="text-sm text-gray-500">Rs. {item.price.toLocaleString()}/{item.unit}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="small"
          icon="Minus"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
        />
        
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        
        <Button
          variant="ghost"
          size="small"
          icon="Plus"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.stock}
        />
      </div>
      
      <div className="text-right">
        <p className="font-semibold text-lg gradient-text">
          Rs. {(item.price * item.quantity).toLocaleString()}
        </p>
        
        <Button
          variant="ghost"
          size="small"
          icon="Trash2"
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:bg-red-50"
        />
      </div>
    </div>
  );
};

export default CartItem;