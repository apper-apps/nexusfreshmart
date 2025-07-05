import React from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import { updateQuantity, removeFromCart } from '@/store/cartSlice';

const CartItem = ({ item }) => {
  const dispatch = useDispatch();

const handleQuantityChange = (newQuantity) => {
    if (newQuantity === 0) {
      dispatch(removeFromCart(item.id));
      toast.success(`${item.name} removed from cart`);
    } else if (newQuantity > item.stock) {
      toast.warning(`Only ${item.stock} ${item.unit || 'pieces'} available in stock`);
      return;
    } else if (newQuantity > 0) {
      dispatch(updateQuantity({ productId: item.id, quantity: newQuantity }));
      toast.info(`${item.name} quantity updated to ${newQuantity}`);
    }
  };

const handleRemove = () => {
    dispatch(removeFromCart(item.id));
    toast.success(`${item.name} removed from cart`);
  };

return (
    <div className={`flex items-center space-x-4 p-4 bg-white rounded-lg shadow-sm border border-gray-100 transition-all duration-300 ${item.isUpdating ? 'quantity-change' : ''}`}>
      <div className="relative">
        <img
          src={item.image || item.imageUrl || '/placeholder-image.jpg'}
          alt={item.name}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg transition-transform duration-200 hover:scale-105"
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
        {item.stock === 0 && (
          <div className="absolute inset-0 bg-red-500 bg-opacity-75 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-medium">Out of Stock</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
        <p className="text-sm text-gray-500">Rs. {item.price.toLocaleString()}/{item.unit}</p>
        {item.stock <= 10 && item.stock > 0 && (
          <p className="text-xs text-orange-600 flex items-center mt-1">
            <ApperIcon name="AlertTriangle" size={12} className="mr-1 flex-shrink-0" />
            Only {item.stock} left
          </p>
        )}
        {item.stock === 0 && (
          <p className="text-xs text-red-600 flex items-center mt-1">
            <ApperIcon name="XCircle" size={12} className="mr-1 flex-shrink-0" />
            Out of stock
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2">
        <Button
          variant="ghost"
          size="small"
          icon="Minus"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={item.quantity <= 1}
          className="hover:bg-red-50 hover:text-red-600 transition-colors duration-200 w-8 h-8 p-1"
        />
        
        <span className={`w-8 text-center font-medium transition-all duration-300 ${item.isUpdating ? 'scale-110 text-primary' : ''}`}>
          {item.quantity}
        </span>
        
        <Button
          variant="ghost"
          size="small"
          icon="Plus"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={item.quantity >= item.stock || item.stock === 0}
          className="hover:bg-green-50 hover:text-green-600 transition-colors duration-200 w-8 h-8 p-1"
        />
      </div>
      
      <div className="text-right min-w-0">
        <p className={`font-semibold text-lg gradient-text transition-all duration-300 ${item.isUpdating ? 'scale-105' : ''}`}>
          Rs. {(item.price * item.quantity).toLocaleString()}
        </p>
        
        <Button
          variant="ghost"
          size="small"
          icon="Trash2"
          onClick={handleRemove}
          className="text-red-500 hover:bg-red-50 hover:text-red-600 mt-1 transition-colors duration-200"
        />
      </div>
    </div>
  );
};

export default CartItem;