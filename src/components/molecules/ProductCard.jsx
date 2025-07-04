import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApperIcon from '@/components/ApperIcon';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import { useCart } from '@/hooks/useCart';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { addToCart, isLoading } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const getPriceChange = () => {
    if (product.previousPrice && product.previousPrice !== product.price) {
      const change = ((product.price - product.previousPrice) / product.previousPrice) * 100;
      return change;
    }
    return null;
  };

  const priceChange = getPriceChange();

  return (
    <div 
      className="card p-4 cursor-pointer hover:shadow-premium transform hover:scale-102 transition-all duration-300"
      onClick={handleCardClick}
    >
      <div className="relative mb-4">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover rounded-lg bg-gray-100"
        />
        
        {product.stock <= 10 && product.stock > 0 && (
          <Badge 
            variant="warning" 
            size="small"
            className="absolute top-2 left-2"
          >
            Low Stock
          </Badge>
        )}
        
        {product.stock === 0 && (
          <Badge 
            variant="danger" 
            size="small"
            className="absolute top-2 left-2"
          >
            Out of Stock
          </Badge>
        )}
        
        {priceChange && (
          <Badge 
            variant={priceChange > 0 ? 'danger' : 'success'} 
            size="small"
            className="absolute top-2 right-2"
          >
            {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold gradient-text">
              Rs. {product.price.toLocaleString()}
            </span>
            <span className="text-sm text-gray-500">
              /{product.unit}
            </span>
          </div>
          
          {product.previousPrice && product.previousPrice !== product.price && (
            <span className="text-sm text-gray-500 line-through">
              Rs. {product.previousPrice.toLocaleString()}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <ApperIcon name="Package" size={16} />
            <span>{product.stock} in stock</span>
          </div>
          
          <Button
            variant="primary"
            size="small"
            icon="Plus"
            onClick={handleAddToCart}
            disabled={product.stock === 0 || isLoading}
            loading={isLoading}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;