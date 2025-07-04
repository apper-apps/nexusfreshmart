import React from 'react';
import ApperIcon from '@/components/ApperIcon';

const Empty = ({ 
  type = 'general', 
  title, 
  description, 
  action, 
  onAction,
  icon 
}) => {
  const getEmptyContent = () => {
    switch (type) {
      case 'cart':
        return {
          icon: 'ShoppingCart',
          title: 'Your cart is empty',
          description: 'Add some fresh items to your cart and enjoy home delivery!',
          action: 'Start Shopping'
        };
      case 'orders':
        return {
          icon: 'Package',
          title: 'No orders yet',
          description: 'Place your first order and get fresh groceries delivered to your door.',
          action: 'Browse Products'
        };
      case 'products':
        return {
          icon: 'Package2',
          title: 'No products found',
          description: 'We could not find any products matching your search. Try adjusting your filters.',
          action: 'Clear Filters'
        };
      case 'search':
        return {
          icon: 'Search',
          title: 'No results found',
          description: 'We could not find any products matching your search. Try different keywords.',
          action: 'Clear Search'
        };
      case 'inventory':
        return {
          icon: 'AlertTriangle',
          title: 'No inventory data',
          description: 'Start adding products to your inventory to track stock levels.',
          action: 'Add Products'
        };
      default:
        return {
          icon: 'FileX',
          title: 'Nothing here yet',
          description: 'This section is empty. Check back later for updates.',
          action: 'Go Back'
        };
    }
  };

  const content = getEmptyContent();
  const displayIcon = icon || content.icon;
  const displayTitle = title || content.title;
  const displayDescription = description || content.description;
  const displayAction = action || content.action;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-full p-8 mb-6">
        <ApperIcon 
          name={displayIcon} 
          size={64} 
          className="text-gray-400" 
        />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-3">
        {displayTitle}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
        {displayDescription}
      </p>
      
      {onAction && (
        <button
          onClick={onAction}
          className="btn-primary inline-flex items-center space-x-2"
        >
          <ApperIcon name="ArrowRight" size={20} />
          <span>{displayAction}</span>
        </button>
      )}
    </div>
  );
};

export default Empty;