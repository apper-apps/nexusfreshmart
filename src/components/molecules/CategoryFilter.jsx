import React from 'react';
import ApperIcon from '@/components/ApperIcon';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  const categoryIcons = {
    'All': 'Grid3x3',
    'Groceries': 'ShoppingBasket',
    'Meat': 'Beef',
    'Fruits': 'Apple',
    'Vegetables': 'Carrot'
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200
            ${selectedCategory === category
              ? 'bg-gradient-to-r from-primary to-accent text-white shadow-md'
              : 'bg-white text-gray-700 border border-gray-200 hover:border-primary hover:text-primary'
            }
          `}
        >
          <ApperIcon 
            name={categoryIcons[category] || 'Tag'} 
            size={18} 
          />
          <span>{category}</span>
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;