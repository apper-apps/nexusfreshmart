import React from 'react';

const Loading = ({ type = 'products' }) => {
  const ProductSkeleton = () => (
    <div className="card p-4 animate-pulse">
      <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
      <div className="bg-gray-200 h-3 rounded w-1/2 mb-2"></div>
      <div className="bg-gray-200 h-6 rounded w-1/3"></div>
    </div>
  );

  const OrderSkeleton = () => (
    <div className="card p-6 animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-gray-200 h-5 rounded w-32"></div>
        <div className="bg-gray-200 h-6 rounded-full w-20"></div>
      </div>
      <div className="bg-gray-200 h-4 rounded w-full mb-2"></div>
      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
      <div className="bg-gray-200 h-4 rounded w-1/2"></div>
    </div>
  );

  const TableSkeleton = () => (
    <div className="card p-6 animate-pulse">
      <div className="bg-gray-200 h-6 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="bg-gray-200 h-4 rounded w-16"></div>
            <div className="bg-gray-200 h-4 rounded w-32"></div>
            <div className="bg-gray-200 h-4 rounded w-24"></div>
            <div className="bg-gray-200 h-4 rounded w-20"></div>
          </div>
        ))}
      </div>
    </div>
  );

  const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="bg-gray-200 h-8 rounded w-16 mb-2"></div>
            <div className="bg-gray-200 h-6 rounded w-24"></div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6 animate-pulse">
          <div className="bg-gray-200 h-6 rounded w-32 mb-4"></div>
          <div className="bg-gray-200 h-64 rounded"></div>
        </div>
        <div className="card p-6 animate-pulse">
          <div className="bg-gray-200 h-6 rounded w-32 mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-4 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSkeletons = () => {
    switch (type) {
      case 'products':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        );
      case 'orders':
        return (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        );
      case 'table':
        return <TableSkeleton />;
      case 'dashboard':
        return <DashboardSkeleton />;
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderSkeletons()}
    </div>
  );
};

export default Loading;