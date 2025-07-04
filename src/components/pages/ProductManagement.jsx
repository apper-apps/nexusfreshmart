import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Empty from "@/components/ui/Empty";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Category from "@/components/pages/Category";
import { productService } from "@/services/api/productService";

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Groceries',
    price: '',
    previousPrice: '',
    unit: 'kg',
    stock: '',
    imageUrl: '',
    isActive: true
  });

  const categories = ['Groceries', 'Meat', 'Fruits', 'Vegetables'];
  const units = ['kg', 'g', 'piece', 'pack', 'liter', 'ml'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        previousPrice: formData.previousPrice ? parseFloat(formData.previousPrice) : null,
        stock: parseInt(formData.stock),
        imageUrl: formData.imageUrl || 'https://via.placeholder.com/300x200?text=Product+Image'
      };

      if (editingProduct) {
        await productService.update(editingProduct.id, productData);
        toast.success('Product updated successfully!');
      } else {
        await productService.create(productData);
        toast.success('Product added successfully!');
      }

      await loadProducts();
      resetForm();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      previousPrice: product.previousPrice?.toString() || '',
      unit: product.unit,
      stock: product.stock.toString(),
      imageUrl: product.imageUrl,
      isActive: product.isActive
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productService.delete(id);
      await loadProducts();
      toast.success('Product deleted successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'Groceries',
      price: '',
      previousPrice: '',
      unit: 'kg',
      stock: '',
      imageUrl: '',
      isActive: true
    });
    setEditingProduct(null);
    setShowAddForm(false);
  };

const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
  const [bulkPriceData, setBulkPriceData] = useState({
    strategy: 'percentage', // 'percentage', 'fixed', 'range'
    value: '',
    minPrice: '',
    maxPrice: '',
    category: 'all',
    applyToLowStock: false,
    stockThreshold: 10
  });

  const handleBulkPriceUpdate = async (updateData) => {
    try {
      const result = await productService.bulkUpdatePrices(updateData);
      await loadProducts();
      toast.success(`Successfully updated ${result.updatedCount} products!`);
      setShowBulkPriceModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update prices');
    }
  };

  const resetBulkPriceData = () => {
    setBulkPriceData({
      strategy: 'percentage',
      value: '',
      minPrice: '',
      maxPrice: '',
      category: 'all',
      applyToLowStock: false,
      stockThreshold: 10
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading type="table" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Error message={error} onRetry={loadProducts} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
<div className="flex space-x-4">
          <Button
            variant="secondary"
            icon="DollarSign"
            onClick={() => setShowBulkPriceModal(true)}
            disabled={products.length === 0}
          >
            Bulk Price Tools
          </Button>
          <Button
            variant="primary"
            icon="Plus"
            onClick={() => setShowAddForm(true)}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="card p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Product Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                icon="Package"
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Price (Rs.)"
                name="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={handleInputChange}
                required
                icon="DollarSign"
              />
              
              <Input
                label="Previous Price (Rs.)"
                name="previousPrice"
                type="number"
                step="0.01"
                value={formData.previousPrice}
                onChange={handleInputChange}
                icon="TrendingDown"
              />
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Unit <span className="text-red-500">*</span>
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  {units.map(unit => (
                    <option key={unit} value={unit}>{unit}</option>
                  ))}
                </select>
              </div>
              
              <Input
                label="Stock Quantity"
                name="stock"
                type="number"
                value={formData.stock}
                onChange={handleInputChange}
                required
                icon="Archive"
              />
              
              <Input
                label="Image URL"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                icon="Image"
                className="md:col-span-2"
              />
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label className="text-sm font-medium text-gray-700">
                  Active Product
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="ghost"
                onClick={resetForm}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                icon={editingProduct ? "Save" : "Plus"}
              >
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Products Table */}
      {products.length === 0 ? (
        <Empty
          type="inventory"
          onAction={() => setShowAddForm(true)}
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {product.unit}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="primary" size="small">
                        {product.category}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        Rs. {product.price.toLocaleString()}
                      </div>
                      {product.previousPrice && product.previousPrice !== product.price && (
                        <div className="text-sm text-gray-500 line-through">
                          Rs. {product.previousPrice.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`text-sm ${product.stock <= 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {product.stock}
                        </span>
                        {product.stock <= 10 && (
                          <ApperIcon name="AlertTriangle" size={16} className="text-red-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={product.isActive ? 'success' : 'danger'} size="small">
                        {product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-primary hover:text-primary-dark"
                        >
                          <ApperIcon name="Edit" size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <ApperIcon name="Trash2" size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
</table>
          </div>
        </div>
      )}
      {/* Bulk Price Update Modal */}
      {showBulkPriceModal && (
        <BulkPriceModal
          products={products}
          categories={categories}
          onUpdate={handleBulkPriceUpdate}
          onClose={() => {
            setShowBulkPriceModal(false);
            resetBulkPriceData();
          }}
        />
      )}
    </div>
);
};

// Bulk Price Update Modal Component
const BulkPriceModal = ({ products, categories, onUpdate, onClose }) => {
  const [updateData, setUpdateData] = useState({
    strategy: 'percentage',
    value: '',
    minPrice: '',
    maxPrice: '',
    category: 'all',
    applyToLowStock: false,
    stockThreshold: 10
  });
  const [preview, setPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUpdateData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setShowPreview(false);
  };

  const generatePreview = () => {
    let filteredProducts = products;
    
    // Filter by category
    if (updateData.category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === updateData.category);
    }
    
    // Filter by stock if enabled
    if (updateData.applyToLowStock) {
      filteredProducts = filteredProducts.filter(p => p.stock <= updateData.stockThreshold);
    }

    const previews = filteredProducts.map(product => {
      let newPrice = product.price;
      
      switch (updateData.strategy) {
        case 'percentage':
          const percentage = parseFloat(updateData.value) || 0;
          newPrice = product.price * (1 + percentage / 100);
          break;
        case 'fixed':
          const fixedAmount = parseFloat(updateData.value) || 0;
          newPrice = product.price + fixedAmount;
          break;
        case 'range':
          // For range strategy, we'll set a proportional price within the range
          const minPrice = parseFloat(updateData.minPrice) || 0;
          const maxPrice = parseFloat(updateData.maxPrice) || product.price;
          newPrice = Math.min(Math.max(product.price, minPrice), maxPrice);
          break;
      }

      // Apply min/max constraints if specified
      if (updateData.minPrice && newPrice < parseFloat(updateData.minPrice)) {
        newPrice = parseFloat(updateData.minPrice);
      }
      if (updateData.maxPrice && newPrice > parseFloat(updateData.maxPrice)) {
        newPrice = parseFloat(updateData.maxPrice);
      }

      return {
        ...product,
        newPrice: Math.round(newPrice * 100) / 100,
        priceChange: Math.round((newPrice - product.price) * 100) / 100
      };
    });

    setPreview(previews);
    setShowPreview(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!updateData.value && updateData.strategy !== 'range') {
      toast.error('Please enter a value for the price update');
      return;
    }

    if (updateData.strategy === 'range' && (!updateData.minPrice || !updateData.maxPrice)) {
      toast.error('Please enter both minimum and maximum prices');
      return;
    }

    const confirmMessage = `Are you sure you want to update prices for ${preview.length} products?`;
    if (confirm(confirmMessage)) {
      onUpdate(updateData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">Bulk Price Update Tools</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ApperIcon name="X" size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Update Strategy */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Update Strategy
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="strategy"
                  value="percentage"
                  checked={updateData.strategy === 'percentage'}
                  onChange={handleInputChange}
                  className="text-primary focus:ring-primary"
                />
                <label className="text-sm text-gray-700">Percentage Change</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="strategy"
                  value="fixed"
                  checked={updateData.strategy === 'fixed'}
                  onChange={handleInputChange}
                  className="text-primary focus:ring-primary"
                />
                <label className="text-sm text-gray-700">Fixed Amount</label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="strategy"
                  value="range"
                  checked={updateData.strategy === 'range'}
                  onChange={handleInputChange}
                  className="text-primary focus:ring-primary"
                />
                <label className="text-sm text-gray-700">Price Range</label>
              </div>
            </div>
          </div>

          {/* Strategy-specific inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {updateData.strategy === 'percentage' && (
              <Input
                label="Percentage Change (%)"
                name="value"
                type="number"
                step="0.1"
                value={updateData.value}
                onChange={handleInputChange}
                placeholder="e.g., 10 for 10% increase, -5 for 5% decrease"
                icon="Percent"
              />
            )}
            
            {updateData.strategy === 'fixed' && (
              <Input
                label="Fixed Amount (Rs.)"
                name="value"
                type="number"
                step="0.01"
                value={updateData.value}
                onChange={handleInputChange}
                placeholder="e.g., 50 to add Rs. 50, -25 to subtract Rs. 25"
                icon="DollarSign"
              />
            )}

            {updateData.strategy === 'range' && (
              <>
                <Input
                  label="Minimum Price (Rs.)"
                  name="minPrice"
                  type="number"
                  step="0.01"
                  value={updateData.minPrice}
                  onChange={handleInputChange}
                  icon="TrendingDown"
                />
                <Input
                  label="Maximum Price (Rs.)"
                  name="maxPrice"
                  type="number"
                  step="0.01"
                  value={updateData.maxPrice}
                  onChange={handleInputChange}
                  icon="TrendingUp"
                />
              </>
            )}
          </div>

          {/* Price constraints */}
          {updateData.strategy !== 'range' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Minimum Price Limit (Rs.)"
                name="minPrice"
                type="number"
                step="0.01"
                value={updateData.minPrice}
                onChange={handleInputChange}
                placeholder="Optional: Set minimum price"
                icon="TrendingDown"
              />
              <Input
                label="Maximum Price Limit (Rs.)"
                name="maxPrice"
                type="number"
                step="0.01"
                value={updateData.maxPrice}
                onChange={handleInputChange}
                placeholder="Optional: Set maximum price"
                icon="TrendingUp"
              />
            </div>
          )}

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Category Filter
              </label>
              <select
                name="category"
                value={updateData.category}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="applyToLowStock"
                  checked={updateData.applyToLowStock}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label className="text-sm font-medium text-gray-700">
                  Apply only to low stock items
                </label>
              </div>
              {updateData.applyToLowStock && (
                <Input
                  label="Stock Threshold"
                  name="stockThreshold"
                  type="number"
                  value={updateData.stockThreshold}
                  onChange={handleInputChange}
                  icon="Archive"
                />
              )}
            </div>
          </div>

          {/* Preview Button */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="secondary"
              icon="Eye"
              onClick={generatePreview}
              disabled={!updateData.value && updateData.strategy !== 'range'}
            >
              Preview Changes
            </Button>
          </div>

          {/* Preview Results */}
          {showPreview && preview.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h3 className="font-medium text-gray-900 mb-3">
                Preview: {preview.length} products will be updated
              </h3>
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {preview.slice(0, 10).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-2 bg-white rounded border">
                      <div className="flex items-center space-x-3">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Rs. {product.price}</span>
                          <ApperIcon name="ArrowRight" size={12} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">Rs. {product.newPrice}</span>
                        </div>
                        <p className={`text-xs ${product.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.priceChange >= 0 ? '+' : ''}Rs. {product.priceChange}
                        </p>
                      </div>
                    </div>
                  ))}
                  {preview.length > 10 && (
                    <p className="text-sm text-gray-500 text-center">
                      ... and {preview.length - 10} more products
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon="Save"
              disabled={!showPreview || preview.length === 0}
            >
              Update {preview.length} Products
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};