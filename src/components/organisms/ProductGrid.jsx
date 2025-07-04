import React from 'react';
import ProductCard from '@/components/molecules/ProductCard';
import Loading from '@/components/ui/Loading';
import Error from '@/components/ui/Error';
import Empty from '@/components/ui/Empty';

const ProductGrid = ({ 
  products, 
  loading, 
  error, 
  onRetry, 
  emptyMessage = "No products found" 
}) => {
  if (loading) {
    return <Loading type="products" />;
  }

  if (error) {
    return <Error message={error} onRetry={onRetry} />;
  }

  if (!products || products.length === 0) {
    return (
      <Empty 
        type="products" 
        description={emptyMessage}
        onAction={onRetry}
        action="Refresh"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;