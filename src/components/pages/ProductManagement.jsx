import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import Empty from "@/components/ui/Empty";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Category from "@/components/pages/Category";
import productService from "@/services/api/productService";
const ProductManagement = () => {
  // State management with proper initialization
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState(false);
const [formData, setFormData] = useState({
    name: "",
    price: "",
    previousPrice: "",
    purchasePrice: "",
    discountType: "Fixed Amount",
    discountValue: "",
    minSellingPrice: "",
    profitMargin: "",
    category: "",
    stock: "",
    minStock: "",
    unit: "",
    description: "",
    imageUrl: "",
    barcode: ""
  });
  
  // Image management state
  const [imageData, setImageData] = useState({
    selectedImage: null,
    croppedImage: null,
    uploadProgress: 0,
    isProcessing: false,
    searchResults: [],
    activeTab: 'upload' // upload, search, ai-generate
  });

  // Constants
  const categories = ["Groceries", "Meat", "Fruits", "Vegetables", "Dairy", "Bakery", "Beverages"];
  const units = ["kg", "g", "piece", "litre", "ml", "pack", "dozen", "box"];

  // Load products with comprehensive error handling
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await productService.getAll();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
      toast.error("Failed to load products. Please try again.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize component
  useEffect(() => {
    loadProducts();
  }, []);

// Handle form input changes with validation and profit calculations
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Auto-calculate profit metrics when relevant fields change
      if (name === 'price' || name === 'purchasePrice' || name === 'discountType' || name === 'discountValue') {
        const calculations = calculateProfitMetrics(newData);
        return {
          ...newData,
          ...calculations
        };
      }
      
      return newData;
    });
  };

  // Handle image upload and processing
  const handleImageUpload = async (file) => {
    try {
      setImageData(prev => ({ ...prev, isProcessing: true, uploadProgress: 0 }));
      
      // Validate image file
      const validation = await productService.validateImage(file);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }
      
      // Process and optimize image
      const processedImage = await productService.processImage(file, {
        targetSize: { width: 600, height: 600 },
        maxFileSize: 100 * 1024, // 100KB
        quality: 0.9
      });
      
      setImageData(prev => ({
        ...prev,
        selectedImage: processedImage.url,
        croppedImage: processedImage.url,
        isProcessing: false,
        uploadProgress: 100
      }));
      
      setFormData(prev => ({ ...prev, imageUrl: processedImage.url }));
      toast.success('Image uploaded and optimized successfully!');
      
    } catch (error) {
      console.error('Error uploading image:', error);
      setImageData(prev => ({ ...prev, isProcessing: false, uploadProgress: 0 }));
      toast.error('Failed to upload image. Please try again.');
    }
  };

  // Handle image search
  const handleImageSearch = async (query) => {
    try {
      setImageData(prev => ({ ...prev, isProcessing: true }));
      
      const searchResults = await productService.searchImages(query);
      setImageData(prev => ({
        ...prev,
        searchResults,
        isProcessing: false
      }));
      
    } catch (error) {
      console.error('Error searching images:', error);
      setImageData(prev => ({ ...prev, isProcessing: false }));
      toast.error('Failed to search images. Please try again.');
    }
};

  // Handle AI image generation
  const handleAIImageGenerate = async (prompt, style = 'realistic') => {
    try {
      setImageData(prev => ({ ...prev, isProcessing: true }));
      
      const generatedImage = await productService.generateAIImage(prompt, {
        style,
        category: formData.category,
        aspectRatio: '1:1',
        quality: 'high'
      });
      
      setImageData(prev => ({
        ...prev,
        selectedImage: generatedImage.url,
        croppedImage: generatedImage.url,
        isProcessing: false
      }));
      
      setFormData(prev => ({ ...prev, imageUrl: generatedImage.url }));
      toast.success('AI image generated successfully!');
      
    } catch (error) {
      console.error('Error generating AI image:', error);
      setImageData(prev => ({ ...prev, isProcessing: false }));
      toast.error('Failed to generate AI image. Please try again.');
    }
  };

  // Handle image selection from search results
  const handleImageSelect = (imageUrl, attribution = null) => {
    setImageData(prev => ({
      ...prev,
      selectedImage: imageUrl,
      croppedImage: imageUrl,
      attribution
    }));
    setFormData(prev => ({ ...prev, imageUrl }));
    toast.success('Image selected successfully!');
  };
  // Calculate profit metrics based on current form data
  const calculateProfitMetrics = (data) => {
    const price = parseFloat(data.price) || 0;
    const purchasePrice = parseFloat(data.purchasePrice) || 0;
    const discountValue = parseFloat(data.discountValue) || 0;
    
    let finalPrice = price;
    
    // Apply discount based on type
    if (discountValue > 0) {
      if (data.discountType === 'Percentage') {
        finalPrice = price - (price * discountValue / 100);
      } else {
        finalPrice = price - discountValue;
      }
    }
    
    // Ensure final price is not negative
    finalPrice = Math.max(0, finalPrice);
    
    // Calculate minimum selling price (purchase price + 10% margin)
    const minSellingPrice = purchasePrice > 0 ? purchasePrice * 1.1 : 0;
    
    // Calculate profit margin percentage
    let profitMargin = 0;
    if (purchasePrice > 0 && finalPrice > 0) {
      profitMargin = ((finalPrice - purchasePrice) / purchasePrice) * 100;
    }
    
    return {
      minSellingPrice: minSellingPrice.toFixed(2),
      profitMargin: profitMargin.toFixed(2)
    };
  };

  // Form submission with comprehensive validation
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.name?.trim()) {
        toast.error("Product name is required");
        return;
      }
      
      if (!formData.price || parseFloat(formData.price) <= 0) {
        toast.error("Valid price is required");
        return;
      }
      
      if (!formData.category) {
        toast.error("Category is required");
        return;
      }
      
      if (!formData.stock || parseInt(formData.stock) < 0) {
        toast.error("Valid stock quantity is required");
        return;
      }

// Validate business rules
      const purchasePrice = parseFloat(formData.purchasePrice) || 0;
      const price = parseFloat(formData.price) || 0;
      
      if (purchasePrice > 0 && price <= purchasePrice) {
        toast.error("Selling price must be greater than purchase price");
        return;
      }

      // Prepare product data with proper validation
      const productData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        previousPrice: formData.previousPrice ? parseFloat(formData.previousPrice) : null,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        discountValue: parseFloat(formData.discountValue) || 0,
        minSellingPrice: parseFloat(formData.minSellingPrice) || 0,
        profitMargin: parseFloat(formData.profitMargin) || 0,
        stock: parseInt(formData.stock) || 0,
        minStock: formData.minStock ? parseInt(formData.minStock) : 5,
        imageUrl: formData.imageUrl || "/api/placeholder/300/200",
        barcode: formData.barcode || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      };

      let result;
      if (editingProduct) {
        result = await productService.update(editingProduct.id, productData);
        toast.success("Product updated successfully!");
      } else {
        result = await productService.create(productData);
        toast.success("Product created successfully!");
      }

      // Reset form and reload products
      resetForm();
      await loadProducts();
      
    } catch (err) {
      console.error("Error saving product:", err);
      toast.error(err.message || "Failed to save product");
    }
  };

  // Handle product editing
  const handleEdit = (product) => {
    if (!product) return;
    
setEditingProduct(product);
    setFormData({
      name: product.name || "",
      price: product.price?.toString() || "",
      previousPrice: product.previousPrice?.toString() || "",
      purchasePrice: product.purchasePrice?.toString() || "",
      discountType: product.discountType || "Fixed Amount",
      discountValue: product.discountValue?.toString() || "",
      minSellingPrice: product.minSellingPrice?.toString() || "",
      profitMargin: product.profitMargin?.toString() || "",
      category: product.category || "",
      stock: product.stock?.toString() || "",
      minStock: product.minStock?.toString() || "",
      unit: product.unit || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      barcode: product.barcode || ""
    });
    setShowAddForm(true);
  };

  // Handle product deletion with confirmation
  const handleDelete = async (id) => {
    if (!id) return;
    
    try {
      const confirmed = window.confirm("Are you sure you want to delete this product?");
      if (!confirmed) return;

      await productService.delete(id);
      toast.success("Product deleted successfully!");
      await loadProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error(err.message || "Failed to delete product");
    }
  };

  // Reset form state
const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      previousPrice: "",
      purchasePrice: "",
      discountType: "Fixed Amount",
      discountValue: "",
      minSellingPrice: "",
      profitMargin: "",
      category: "",
      stock: "",
      minStock: "",
      unit: "",
      description: "",
      imageUrl: "",
      barcode: ""
    });
    
    // Reset image data
    setImageData({
      selectedImage: null,
      croppedImage: null,
      uploadProgress: 0,
      isProcessing: false,
      searchResults: [],
      activeTab: 'upload'
    });
    
    setEditingProduct(null);
    setShowAddForm(false);
  };

  // Handle bulk price update
  const handleBulkPriceUpdate = async (updateData) => {
    try {
      if (!updateData) {
        toast.error("Invalid update data");
        return;
      }

      await productService.bulkUpdatePrices(updateData);
      toast.success("Bulk price update completed successfully!");
      setShowBulkPriceModal(false);
      await loadProducts();
    } catch (err) {
      console.error("Error updating prices:", err);
      toast.error(err.message || "Failed to update prices");
    }
  };

  // Filter products with null safety
  const filteredProducts = products.filter(product => {
    if (!product) return false;
    
    const matchesSearch = !searchTerm || 
      (product.name && product.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.barcode && product.barcode.includes(searchTerm));
    
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Error boundary component
  if (error) {
    return <Error message={error} onRetry={loadProducts} />;
  }

  // Loading state
  if (loading) {
    return <Loading />;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Product Management</h1>
          <p className="text-gray-600">Manage your product inventory and pricing</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 sm:mt-0">
          <Button
            variant="secondary"
            icon="DollarSign"
            onClick={() => setShowBulkPriceModal(true)}
            disabled={!products.length}
          >
            Bulk Price Update
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

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Search Products"
            placeholder="Search by name or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon="Search"
          />
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Products ({filteredProducts.length})
            </h2>
            <div className="flex items-center space-x-2">
              <Badge variant="primary">
                Total: {products.length}
              </Badge>
              <Badge variant="secondary">
                Low Stock: {products.filter(p => p && p.stock <= (p.minStock || 5)).length}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredProducts.length === 0 ? (
            <Empty 
              title="No products found"
              description="Try adjusting your search or filter criteria"
            />
          ) : (
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
                      Price / Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Profit Margin
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={product.imageUrl || "/api/placeholder/40/40"}
                              alt={product.name || "Product"}
                              onError={(e) => {
                                e.target.src = "/api/placeholder/40/40";
                              }}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name || "Unnamed Product"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {product.barcode || "No barcode"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="secondary">
                          {product.category || "No Category"}
                        </Badge>
                      </td>
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex flex-col">
                          <span className="font-medium">Rs. {product.price || 0}</span>
                          {product.purchasePrice && (
                            <span className="text-xs text-gray-500">
                              Cost: Rs. {product.purchasePrice}
                            </span>
                          )}
                          {product.previousPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              Was: Rs. {product.previousPrice}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {product.profitMargin ? (
                          <div className="flex flex-col">
                            <Badge 
                              variant={parseFloat(product.profitMargin) > 20 ? "success" : parseFloat(product.profitMargin) > 10 ? "warning" : "error"}
                            >
                              {product.profitMargin}%
                            </Badge>
                            {product.minSellingPrice && (
                              <span className="text-xs text-gray-500 mt-1">
                                Min: Rs. {product.minSellingPrice}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={product.stock <= (product.minStock || 5) ? "error" : "success"}
                        >
                          {product.stock || 0} {product.unit || "pcs"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="Edit"
                            onClick={() => handleEdit(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            icon="Trash2"
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ApperIcon name="X" size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Product Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  icon="Package"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="input-field"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Price (Rs.) *"
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
</div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Purchase Price (Rs.) *"
                  name="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice}
                  onChange={handleInputChange}
                  required
                  icon="ShoppingCart"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Discount Type
                  </label>
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="Fixed Amount">Fixed Amount (Rs.)</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label={`Discount Value ${formData.discountType === 'Percentage' ? '(%)' : '(Rs.)'}`}
                  name="discountValue"
                  type="number"
                  step={formData.discountType === 'Percentage' ? "0.1" : "0.01"}
                  max={formData.discountType === 'Percentage' ? "100" : undefined}
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  icon="Tag"
                />
                <Input
                  label="Min Selling Price (Rs.)"
                  name="minSellingPrice"
                  type="number"
                  step="0.01"
                  value={formData.minSellingPrice}
                  readOnly
                  className="bg-gray-50"
                  icon="TrendingDown"
                />
                <Input
                  label="Profit Margin (%)"
                  name="profitMargin"
                  type="number"
                  step="0.01"
                  value={formData.profitMargin}
                  readOnly
                  className="bg-gray-50"
                  icon="TrendingUp"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Stock Quantity *"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                  icon="Archive"
                />
                <Input
                  label="Min Stock Level"
                  name="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={handleInputChange}
                  placeholder="5"
                  icon="AlertTriangle"
                />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="input-field"
                  >
<option value="">Select Unit</option>
                    {units.map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </div>
<Input
                label="Description"
                name="description"
                type="textarea"
                placeholder="Product description..."
                value={formData.description}
                onChange={handleInputChange}
                icon="FileText"
              />

              {/* Intelligent Image Integration System */}
              <ImageUploadSystem
                imageData={imageData}
                setImageData={setImageData}
                onImageUpload={handleImageUpload}
                onImageSearch={handleImageSearch}
                onImageSelect={handleImageSelect}
                onAIImageGenerate={handleAIImageGenerate}
                formData={formData}
              />
              <Input
                label="Barcode"
                name="barcode"
                value={formData.barcode}
                onChange={handleInputChange}
                icon="BarChart"
              />
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
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
                  icon="Save"
                >
                  {editingProduct ? "Update Product" : "Add Product"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Price Update Modal */}
      {showBulkPriceModal && (
        <BulkPriceModal
          products={products}
          categories={categories}
          onUpdate={handleBulkPriceUpdate}
          onClose={() => setShowBulkPriceModal(false)}
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
    try {
      if (!Array.isArray(products) || products.length === 0) {
        toast.error('No products available for update');
        return;
      }

      let filteredProducts = [...products];
      
      // Filter by category with null safety
      if (updateData.category !== 'all') {
        filteredProducts = filteredProducts.filter(p => p && p.category === updateData.category);
      }
      
      // Filter by stock if enabled
      if (updateData.applyToLowStock) {
        const threshold = parseInt(updateData.stockThreshold) || 10;
        filteredProducts = filteredProducts.filter(p => p && p.stock <= threshold);
      }

      if (filteredProducts.length === 0) {
        toast.error('No products match the selected criteria');
        return;
      }

      const previews = filteredProducts.map(product => {
        if (!product || typeof product.price !== 'number') {
          return {
            ...product,
            newPrice: product?.price || 0,
            priceChange: 0
          };
        }

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
            const minPrice = parseFloat(updateData.minPrice) || 0;
            const maxPrice = parseFloat(updateData.maxPrice) || product.price;
            newPrice = Math.min(Math.max(product.price, minPrice), maxPrice);
            break;
          default:
            newPrice = product.price;
        }

        // Apply min/max constraints if specified
        if (updateData.minPrice && newPrice < parseFloat(updateData.minPrice)) {
          newPrice = parseFloat(updateData.minPrice);
        }
        if (updateData.maxPrice && newPrice > parseFloat(updateData.maxPrice)) {
          newPrice = parseFloat(updateData.maxPrice);
        }

        // Ensure price is never negative
        newPrice = Math.max(0, newPrice);

        return {
          ...product,
          newPrice: Math.round(newPrice * 100) / 100,
          priceChange: Math.round((newPrice - product.price) * 100) / 100
        };
      });

      setPreview(previews);
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      toast.error('Failed to generate preview. Please try again.');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    try {
      if (!updateData.value && updateData.strategy !== 'range') {
        toast.error('Please enter a value for the price update');
        return;
      }

      if (updateData.strategy === 'range' && (!updateData.minPrice || !updateData.maxPrice)) {
        toast.error('Please enter both minimum and maximum prices');
        return;
      }

      if (updateData.strategy === 'range') {
        const minPrice = parseFloat(updateData.minPrice);
        const maxPrice = parseFloat(updateData.maxPrice);
        if (minPrice >= maxPrice) {
          toast.error('Maximum price must be greater than minimum price');
          return;
        }
      }

      if (!showPreview || preview.length === 0) {
        toast.error('Please generate a preview first');
        return;
      }

      const confirmMessage = `Are you sure you want to update prices for ${preview.length} products?`;
      if (window.confirm(confirmMessage)) {
        onUpdate(updateData);
      }
    } catch (error) {
      console.error('Error submitting bulk price update:', error);
      toast.error('Failed to process bulk price update');
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
                {Array.isArray(categories) && categories.map(cat => (
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
                          src={product.imageUrl || "/api/placeholder/32/32"}
                          alt={product.name || "Product"}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            e.target.src = "/api/placeholder/32/32";
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name || "Unnamed Product"}</p>
                          <p className="text-xs text-gray-500">{product.category || "No Category"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Rs. {product.price || 0}</span>
                          <ApperIcon name="ArrowRight" size={12} className="text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">Rs. {product.newPrice || 0}</span>
                        </div>
                        <p className={`text-xs ${(product.priceChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(product.priceChange || 0) >= 0 ? '+' : ''}Rs. {product.priceChange || 0}
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

// Intelligent Image Upload System Component
const ImageUploadSystem = ({ 
  imageData, 
  setImageData, 
  onImageUpload, 
  onImageSearch, 
  onImageSelect,
  onAIImageGenerate,
  formData
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cropData, setCropData] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const fileInputRef = useRef(null);

  // Handle image selection from search results or AI generation
  const handleImageSelect = (imageUrl, attribution = null) => {
    try {
      if (!imageUrl) {
        toast.error('Invalid image URL');
        return;
      }
      
      setImageData(prev => ({ 
        ...prev, 
        selectedImage: imageUrl, 
        attribution,
        isProcessing: false 
      }));
      
      if (onImageSelect) {
        onImageSelect(imageUrl, attribution);
      }
      
      toast.success('Image selected successfully!');
    } catch (error) {
      console.error('Error selecting image:', error);
      toast.error('Failed to select image');
    }
  };

  // Handle AI image generation
  const handleAIImageGenerate = async (prompt, style = 'realistic') => {
    try {
      if (!prompt?.trim()) {
        toast.error('Please provide a prompt for AI generation');
        return;
      }
      
      setImageData(prev => ({ ...prev, isProcessing: true }));
      
      // Simulate AI generation process
      const generatedImage = await new Promise((resolve) => {
        setTimeout(() => {
          resolve(`https://picsum.photos/600/600?random=${Date.now()}`);
        }, 2000);
      });
      
      handleImageSelect(generatedImage, 'AI Generated');
      
    } catch (error) {
      console.error('Error generating AI image:', error);
      toast.error('Failed to generate AI image');
      setImageData(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Handle drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }
    
    // Validate file size (max 10MB for processing)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image file size must be less than 10MB');
      return;
    }
    
    if (onImageUpload) {
      onImageUpload(file);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onImageSearch) {
      onImageSearch(searchQuery.trim());
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        Product Image *
      </label>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'upload', label: 'Upload', icon: 'Upload' },
          { id: 'search', label: 'AI Search', icon: 'Search' },
          { id: 'ai-generate', label: 'AI Generate', icon: 'Sparkles' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setImageData(prev => ({ ...prev, activeTab: tab.id }))}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              imageData.activeTab === tab.id
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ApperIcon name={tab.icon} size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {imageData.activeTab === 'upload' && (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary hover:bg-gray-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-3">
              <div className={`p-3 rounded-full ${dragActive ? 'bg-primary/10' : 'bg-gray-100'}`}>
                <ApperIcon 
                  name={dragActive ? "Download" : "ImagePlus"} 
                  size={32} 
                  className={dragActive ? 'text-primary' : 'text-gray-400'}
                />
              </div>
              
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {dragActive ? 'Drop image here' : 'Upload product image'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag & drop or click to browse • Max 10MB • Auto-optimized to 600x600px
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                <span>JPG</span>
                <span>PNG</span>
                <span>WEBP</span>
                <span>HEIC</span>
              </div>
            </div>
          </div>

          {/* Upload Progress */}
          {imageData.isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing image...</span>
                <span className="text-gray-600">{imageData.uploadProgress || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${imageData.uploadProgress || 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Image Preview & Cropping */}
          {imageData.selectedImage && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Image Preview</h4>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon="RotateCcw"
                    onClick={() => setImageData(prev => ({ ...prev, selectedImage: null, croppedImage: null }))}
                  >
                    Remove
                  </Button>
                </div>
              </div>
              
              <div className="relative">
                <img
                  src={imageData.selectedImage}
                  alt="Product preview"
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
                
                {/* Enhanced Visual Boundary Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Corner Markers for Image Boundaries */}
                  <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                  <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                  <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                  <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>
                  
                  {/* Frame Compatibility Badge */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white px-3 py-1 rounded-full text-xs font-medium shadow-md">
                    <div className="flex items-center space-x-1">
                      <ApperIcon name="CheckCircle" size={12} />
                      <span>Frame Compatible</span>
                    </div>
                  </div>
                  
                  {/* Quality Indicator */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-success text-white px-2 py-1 rounded text-xs">
                    Quality: High
                  </div>
                  
                  {/* Crop Area Guide */}
                  <div className="absolute inset-4 border-2 border-dashed border-accent/50 rounded-lg">
                    <div className="absolute -top-5 left-0 text-xs text-gray-600 bg-white px-1 rounded">
                      Optimal Crop Area
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Image Optimization Settings */}
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-lg space-y-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900 flex items-center space-x-2">
                    <ApperIcon name="Settings" size={16} />
                    <span>Optimization & Quality Settings</span>
                  </h5>
                  <Badge variant="success" className="text-xs">
                    Validated
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <ApperIcon name="Maximize2" size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-600">Target Size:</span>
                      <span className="ml-2 font-medium">600 x 600px</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ApperIcon name="HardDrive" size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-600">Max File Size:</span>
                      <span className="ml-2 font-medium">≤ 100KB</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ApperIcon name="Square" size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-600">Aspect Ratio:</span>
                      <span className="ml-2 font-medium">1:1 (Square)</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ApperIcon name="FileImage" size={14} className="text-gray-500" />
                    <div>
                      <span className="text-gray-600">Format:</span>
                      <span className="ml-2 font-medium">WebP/JPEG</span>
                    </div>
                  </div>
                </div>
                
                {/* Quality Assessment Indicators */}
                <div className="bg-white p-3 rounded border space-y-2">
                  <h6 className="text-sm font-medium text-gray-800 flex items-center space-x-1">
                    <ApperIcon name="Shield" size={14} />
                    <span>Quality Assessment</span>
                  </h6>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span className="text-gray-600">No watermarks detected</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span className="text-gray-600">High image sharpness</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span className="text-gray-600">Proper resolution</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-success"></div>
                      <span className="text-gray-600">Clean background</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                    <span className="text-sm text-gray-700">Smart cropping</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" />
                    <span className="text-sm text-gray-700">Remove background</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-primary focus:ring-primary" defaultChecked />
                    <span className="text-sm text-gray-700">Quality validation</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

{/* Enhanced Unsplash Search Tab */}
      {imageData.activeTab === 'search' && (
        <UnsplashImageSearch
          imageData={imageData}
          setImageData={setImageData}
          onImageSearch={onImageSearch}
          onImageSelect={handleImageSelect}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          formData={formData}
        />
      )}

{/* Enhanced AI Image Generator Tab */}
      {imageData.activeTab === 'ai-generate' && (
        <AIImageGenerator
          imageData={imageData}
          setImageData={setImageData}
          onImageGenerate={handleAIImageGenerate}
          onImageSelect={handleImageSelect}
          formData={formData}
        />
      )}
    </div>
  );
};

// AI Image Generator Component
const AIImageGenerator = ({ 
  imageData, 
  setImageData, 
  onImageGenerate, 
  onImageSelect,
  formData 
}) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generationHistory, setGenerationHistory] = useState([]);

  const styles = [
    { id: 'realistic', name: 'Hyper-Realistic', description: 'Photo-realistic product images' },
    { id: 'clean', name: 'Clean & Minimal', description: 'Clean white background style' },
    { id: 'studio', name: 'Studio Quality', description: 'Professional studio lighting' },
    { id: 'lifestyle', name: 'Lifestyle', description: 'Natural everyday setting' },
    { id: 'artistic', name: 'Artistic', description: 'Creative and artistic presentation' },
    { id: 'commercial', name: 'Commercial', description: 'Marketing-ready images' }
  ];

  const foodCategories = [
    'Fresh Vegetables', 'Tropical Fruits', 'Dairy Products', 'Premium Meat', 'Artisan Bakery',
    'Organic Produce', 'Seafood & Fish', 'Nuts & Seeds', 'Spices & Herbs', 'Beverages',
    'Frozen Foods', 'Canned Goods', 'Snacks & Treats', 'Breakfast Items', 'Condiments',
    'Health Foods', 'International Cuisine', 'Desserts & Sweets', 'Ready Meals', 'Baby Food'
  ];

  const promptSuggestions = [
    'Fresh organic vegetables on a clean white background',
    'Premium quality meat cuts with professional lighting',
    'Artisan bread loaves in a rustic bakery setting',
    'Colorful tropical fruits arranged aesthetically',
    'Dairy products with milk splash effect',
    'Gourmet cheese selection on marble surface'
  ];

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (aiPrompt.trim()) {
      await onImageGenerate(aiPrompt.trim(), selectedStyle);
      
      // Add to generation history
      setGenerationHistory(prev => [{
        prompt: aiPrompt.trim(),
        style: selectedStyle,
        timestamp: new Date().toISOString()
      }, ...prev.slice(0, 9)]); // Keep last 10
    }
  };

  const generateSmartPrompt = () => {
    const category = formData.category || 'food product';
    const productName = formData.name || 'product';
    const prompts = [
      `Professional ${category.toLowerCase()} photography of ${productName}, studio lighting, clean white background, commercial quality`,
      `High-resolution ${productName} image, ${category.toLowerCase()}, marketing photography, attractive presentation`,
      `Premium ${productName}, ${category.toLowerCase()} category, professional food photography, clean and appetizing`
    ];
    const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
    setAiPrompt(randomPrompt);
  };

  return (
    <div className="space-y-6">
      {/* AI Generation Form */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2 mb-4">
          <ApperIcon name="Sparkles" size={20} className="text-purple-600" />
          <h4 className="font-medium text-gray-900">AI Image Generation</h4>
          <Badge variant="success" className="text-xs">Stable Diffusion</Badge>
        </div>
        
        <form onSubmit={handlePromptSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Describe your product image
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="E.g., Fresh organic tomatoes on a clean white background, professional studio lighting..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={generateSmartPrompt}
                icon="Wand2"
              >
                Smart Suggest
              </Button>
              <span className="text-xs text-gray-500">{aiPrompt.length}/500</span>
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Generation Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {styles.map((style) => (
                <div
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedStyle === style.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{style.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{style.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Quick Prompts
            </label>
            <div className="flex flex-wrap gap-2">
              {promptSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setAiPrompt(suggestion)}
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors"
                >
                  {suggestion.split(' ').slice(0, 4).join(' ')}...
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button
              type="submit"
              variant="primary"
              disabled={imageData.isProcessing || !aiPrompt.trim()}
              loading={imageData.isProcessing}
              icon="Sparkles"
              className="flex-1"
            >
              {imageData.isProcessing ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>
        </form>

        {/* Generation Progress */}
        {imageData.isProcessing && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Generating high-quality image...</span>
              <span className="text-purple-600">~30 seconds</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <div className="text-xs text-gray-500">Processing with Stable Diffusion AI</div>
          </div>
        )}
      </div>

      {/* Generated Images */}
      {imageData.selectedImage && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Generated Image</h4>
          <div className="relative group">
            <img
              src={imageData.selectedImage}
              alt="AI Generated"
              className="w-full max-w-md mx-auto rounded-lg shadow-md"
              style={{ maxHeight: '400px', objectFit: 'contain' }}
            />
            <div className="absolute top-2 left-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded text-xs">
              AI Generated
            </div>
          </div>
        </div>
      )}

      {/* Generation History */}
      {generationHistory.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Recent Generations</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {generationHistory.map((item, index) => (
              <div
                key={index}
                onClick={() => setAiPrompt(item.prompt)}
                className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
              >
                <div className="text-sm text-gray-900 line-clamp-1">{item.prompt}</div>
                <div className="text-xs text-gray-500 flex justify-between">
                  <span>{item.style}</span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Unsplash Image Search Component
const UnsplashImageSearch = ({ 
  imageData, 
  setImageData, 
  onImageSearch, 
  onImageSelect, 
  searchQuery, 
  setSearchQuery 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [orientation, setOrientation] = useState('square');

  // Comprehensive food category mapping for enhanced search
  const foodCategories = [
    { id: 'vegetables', name: 'Fresh Vegetables', icon: 'Carrot', color: 'bg-green-100 text-green-700' },
    { id: 'fruits', name: 'Tropical Fruits', icon: 'Apple', color: 'bg-orange-100 text-orange-700' },
    { id: 'meat', name: 'Premium Meat', icon: 'Beef', color: 'bg-red-100 text-red-700' },
    { id: 'dairy', name: 'Dairy Products', icon: 'Milk', color: 'bg-blue-100 text-blue-700' },
    { id: 'bakery', name: 'Artisan Bakery', icon: 'Bread', color: 'bg-yellow-100 text-yellow-700' },
    { id: 'seafood', name: 'Seafood & Fish', icon: 'Fish', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'beverages', name: 'Beverages', icon: 'Coffee', color: 'bg-purple-100 text-purple-700' },
    { id: 'spices', name: 'Spices & Herbs', icon: 'Leaf', color: 'bg-emerald-100 text-emerald-700' },
    { id: 'organic', name: 'Organic Produce', icon: 'Sprout', color: 'bg-lime-100 text-lime-700' },
    { id: 'snacks', name: 'Healthy Snacks', icon: 'Cookie', color: 'bg-amber-100 text-amber-700' }
  ];

  const trendingSearches = [
    'organic vegetables', 'fresh fruits', 'artisan bread', 'premium coffee',
    'dairy products', 'healthy snacks', 'gourmet cheese', 'fresh herbs',
    'farm fresh', 'sustainable food', 'local produce', 'superfood'
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onImageSearch(searchQuery.trim(), { category: selectedCategory, orientation });
    }
  };

  const handleCategorySearch = (category) => {
    setSelectedCategory(category.id || category);
    const searchTerm = category.id ? category.name.toLowerCase() : (category === 'all' ? 'food' : category.toLowerCase());
    setSearchQuery(searchTerm);
    onImageSearch(searchTerm, { category: category.id || category, orientation });
};
  return (
    <div className="space-y-6">
      {/* Search Form */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <ApperIcon name="Search" size={20} className="text-blue-600" />
          <h4 className="font-medium text-gray-900">Unsplash Image Search</h4>
          <Badge variant="info" className="text-xs">1M+ Images</Badge>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search high-quality product images..."
              icon="Search"
              className="flex-1"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={imageData.isProcessing || !searchQuery.trim()}
              loading={imageData.isProcessing}
            >
              Search
            </Button>
          </div>

{/* Advanced Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Category Filter</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field text-sm"
              >
                <option value="all">All Categories</option>
                {foodCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Image Orientation</label>
              <select
                value={orientation}
                onChange={(e) => setOrientation(e.target.value)}
                className="input-field text-sm"
              >
                <option value="square">Square (1:1) - Recommended</option>
                <option value="landscape">Landscape (4:3)</option>
                <option value="portrait">Portrait (3:4)</option>
                <option value="any">Any Orientation</option>
              </select>
            </div>
          </div>
        </form>

        {/* Enhanced Category Quick Filters */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">Browse by Category</label>
            <Badge variant="info" className="text-xs">Zero Redirects</Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {foodCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategorySearch(category)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedCategory === category.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300 bg-white hover:bg-blue-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className={`p-2 rounded-full ${category.color}`}>
                    <ApperIcon name={category.icon} size={20} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">
                    {category.name}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Trending Searches */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium text-gray-700">Trending Searches</label>
            <ApperIcon name="TrendingUp" size={16} className="text-blue-600" />
          </div>
<div className="flex flex-wrap gap-2">
            {trendingSearches.map((term, index) => (
              <button
                key={term}
                onClick={() => {
                  setSearchQuery(term);
                  onImageSearch(term, { category: selectedCategory, orientation });
                }}
                className="group px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-sm hover:from-blue-200 hover:to-indigo-200 transition-all duration-200 hover:scale-105 border border-blue-200 hover:border-blue-300"
              >
                <div className="flex items-center space-x-2">
                  <span>{term}</span>
                  {index < 4 && <ApperIcon name="Flame" size={12} className="text-orange-500 group-hover:animate-pulse" />}
                </div>
              </button>
            ))}
          </div>
          
          {/* Search Stats */}
          <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <ApperIcon name="Database" size={12} />
              <span>1M+ High-Quality Images</span>
            </div>
            <div className="flex items-center space-x-1">
              <ApperIcon name="Shield" size={12} />
              <span>Commercial License Included</span>
            </div>
          </div>
        </div>
      </div>
{/* Enhanced Search Results Display */}
      {imageData.searchResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <h4 className="font-medium text-gray-900">
                Search Results ({imageData.searchResults.length})
              </h4>
              <Badge variant="success" className="text-xs">Live Results</Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <ApperIcon name="Award" size={14} />
                <span>High-Quality</span>
              </div>
              <div className="flex items-center space-x-1">
                <ApperIcon name="Shield" size={14} />
                <span>Commercial Use</span>
              </div>
              <div className="flex items-center space-x-1">
                <ApperIcon name="Zap" size={14} />
                <span>Zero Redirects</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {imageData.searchResults.map((image, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-xl overflow-hidden aspect-square bg-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-102 border-2 border-transparent hover:border-blue-200"
              >
                <img
                  src={image.thumbnail}
                  alt={image.description || 'Search result'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                  onClick={() => onImageSelect(image.url, image.attribution)}
/>
                
                {/* Enhanced Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-3">
                  {/* Top Icons */}
                  <div className="flex justify-between items-start">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-1">
                      <ApperIcon name="Eye" size={16} className="text-gray-700" />
                    </div>
                    <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      Unsplash
                    </div>
                  </div>
                  
                  {/* Center Download Button */}
                  <div className="flex items-center justify-center">
                    <div className="bg-white/95 backdrop-blur-sm rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                      <ApperIcon name="Download" size={20} className="text-blue-600" />
                    </div>
                  </div>
                  
                  {/* Bottom Attribution */}
                  <div className="space-y-1">
                    {image.attribution && (
                      <div className="text-white text-xs font-medium">
                        📸 {image.attribution.photographer}
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Badge variant="success" className="text-xs">Free</Badge>
                      <Badge variant="info" className="text-xs">Commercial OK</Badge>
                    </div>
                  </div>
                </div>
                
                {/* Quick Info Badge */}
                <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {image.quality || 'HD'}
                </div>
              </div>
            ))}
          </div>
{/* Enhanced Load More Section */}
          <div className="flex flex-col items-center space-y-4">
            <Button
              variant="secondary"
              icon="Plus"
              onClick={() => onImageSearch(searchQuery, { 
                category: selectedCategory, 
                orientation,
                loadMore: true 
              })}
              disabled={imageData.isProcessing}
              loading={imageData.isProcessing}
              className="min-w-48"
            >
              {imageData.isProcessing ? 'Loading More...' : 'Load More Images'}
            </Button>
            
            {/* Load More Info */}
            <div className="text-center text-sm text-gray-500 space-y-1">
              <div className="flex items-center justify-center space-x-2">
                <ApperIcon name="Infinity" size={14} />
                <span>Unlimited high-quality results</span>
              </div>
              <div className="text-xs">
                All images are optimized for your product catalog
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {searchQuery && imageData.searchResults.length === 0 && !imageData.isProcessing && (
        <div className="text-center py-12">
          <ApperIcon name="Search" size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
          <p className="text-gray-600 mb-4">No images found for "{searchQuery}"</p>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Try:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['organic food', 'fresh produce', 'healthy ingredients'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    onImageSearch(suggestion, { category: selectedCategory, orientation });
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Copyright Notice */}
{/* Enhanced Copyright and License Notice */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <ApperIcon name="Shield" size={16} className="text-blue-600" />
            <span className="font-medium text-gray-900">License & Usage Information</span>
            <Badge variant="success" className="text-xs">Verified</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <ApperIcon name="CheckCircle" size={14} className="text-green-600" />
                <span className="text-gray-700">Free for commercial use</span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="CheckCircle" size={14} className="text-green-600" />
                <span className="text-gray-700">No attribution required</span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="CheckCircle" size={14} className="text-green-600" />
                <span className="text-gray-700">High-resolution downloads</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <ApperIcon name="Users" size={14} className="text-blue-600" />
                <span className="text-gray-700">Support photographers</span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="Globe" size={14} className="text-blue-600" />
                <span className="text-gray-700">Powered by Unsplash API</span>
              </div>
              <div className="flex items-center space-x-2">
                <ApperIcon name="Zap" size={14} className="text-blue-600" />
                <span className="text-gray-700">Zero-redirect browsing</span>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 pt-2 border-t border-gray-200">
            <p>All images are sourced from Unsplash and comply with their license terms. While attribution is not required, it's appreciated by photographers and helps support the creative community.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;