import React from 'react';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { useCart } from '@/hooks/useCart';

const CartItem = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();

const handleQuantityChange = (newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(item.id);
      toast.success(`${item.name} removed from cart`);
    } else if (newQuantity > item.stock) {
      toast.warning(`Only ${item.stock} ${item.unit || 'pieces'} available in stock`);
      return;
    } else if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
      toast.info(`${item.name} quantity updated to ${newQuantity}`);
    }
  };

  const handleRemove = () => {
    removeFromCart(item.id);
    toast.success(`${item.name} removed from cart`);
  };

return (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <img
        src={item.image || item.imageUrl || '/placeholder-image.jpg'}
        alt={item.name}
        className="w-16 h-16 object-cover rounded-lg"
        onError={(e) => {
          e.target.src = '/placeholder-image.jpg';
        }}
      />
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{item.name}</h4>
        <p className="text-sm text-gray-500">Rs. {item.price.toLocaleString()}/{item.unit}</p>
        {item.stock <= 10 && (
          <p className="text-xs text-orange-600 flex items-center mt-1">
            <ApperIcon name="AlertTriangle" size={12} className="mr-1" />
            Only {item.stock} left in stock
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
<Button
          variant="ghost"
          size="small"
          icon="Minus"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="hover:bg-red-50 hover:text-red-600"
        />
        
        <span className="w-8 text-center font-medium">{item.quantity}</span>
        
        <Button
          variant="ghost"
          size="small"
          icon="Plus"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.stock}
          className="hover:bg-green-50 hover:text-green-600"
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
          onClick={handleRemove}
          className="text-red-500 hover:bg-red-50 mt-1"
        />
      </div>
    </div>
  );
};

export default CartItem;