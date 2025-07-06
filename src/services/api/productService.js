import productsData from "../mockData/products.json";

class ProductService {
  constructor() {
    this.products = [...productsData];
  }

  async getAll() {
    await this.delay();
    return [...this.products];
  }

  async getById(id) {
    await this.delay();
    const product = this.products.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }
    return { ...product };
  }

async create(productData) {
    await this.delay();
    
    // Validate required fields
    if (!productData.name || !productData.price || productData.stock === undefined) {
      throw new Error('Name, price, and stock are required fields');
    }
    // Validate data types and constraints
    if (productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (productData.stock < 0) {
      throw new Error('Stock cannot be negative');
    }

const newProduct = {
      id: this.getNextId(),
      ...productData,
      price: parseFloat(productData.price),
      purchasePrice: parseFloat(productData.purchasePrice) || 0,
      discountValue: parseFloat(productData.discountValue) || 0,
      minSellingPrice: parseFloat(productData.minSellingPrice) || 0,
      profitMargin: parseFloat(productData.profitMargin) || 0,
      stock: parseInt(productData.stock),
      minStock: productData.minStock ? parseInt(productData.minStock) : 10,
      isActive: productData.isActive !== undefined ? productData.isActive : true
    };
    
    this.products.push(newProduct);
    return { ...newProduct };
  }

  async update(id, productData) {
    await this.delay();
    
    const index = this.products.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      throw new Error('Product not found');
    }

    // Validate if provided
    if (productData.price !== undefined && productData.price <= 0) {
      throw new Error('Price must be greater than 0');
    }

    if (productData.stock !== undefined && productData.stock < 0) {
      throw new Error('Stock cannot be negative');
    }

    // Preserve existing ID
    const updatedProduct = { 
      ...this.products[index], 
      ...productData, 
      id: this.products[index].id 
    };
    
    this.products[index] = updatedProduct;
    return { ...updatedProduct };
  }

  async delete(id) {
    await this.delay();
    
    const index = this.products.findIndex(p => p.id === parseInt(id));
    if (index === -1) {
      throw new Error('Product not found');
    }
    
    this.products.splice(index, 1);
    return true;
  }

  async getByBarcode(barcode) {
    await this.delay();
    const product = this.products.find(p => p.barcode === barcode && p.isActive);
    if (!product) {
      throw new Error('Product not found');
    }
    return { ...product };
  }

  getNextId() {
    const maxId = this.products.reduce((max, product) => 
      product.id > max ? product.id : max, 0);
    return maxId + 1;
  }

async bulkUpdatePrices(updateData) {
    await this.delay(500); // Longer delay for bulk operations
    
    const validation = this.validateBulkPriceUpdate(updateData);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }
    let filteredProducts = [...this.products];
    
    // Filter by category
    if (updateData.category !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.category === updateData.category);
    }
    
    // Filter by stock if enabled
    if (updateData.applyToLowStock) {
      filteredProducts = filteredProducts.filter(p => p.stock <= updateData.stockThreshold);
    }

    let updatedCount = 0;
    
    // Apply price updates
    filteredProducts.forEach(product => {
      const originalPrice = product.price;
      let newPrice = originalPrice;
      
      switch (updateData.strategy) {
        case 'percentage':
          const percentage = parseFloat(updateData.value) || 0;
          newPrice = originalPrice * (1 + percentage / 100);
          break;
        case 'fixed':
          const fixedAmount = parseFloat(updateData.value) || 0;
          newPrice = originalPrice + fixedAmount;
          break;
        case 'range':
          const minPrice = parseFloat(updateData.minPrice) || 0;
          const maxPrice = parseFloat(updateData.maxPrice) || originalPrice;
          newPrice = Math.min(Math.max(originalPrice, minPrice), maxPrice);
          break;
      }

      // Apply min/max constraints if specified
      if (updateData.minPrice && newPrice < parseFloat(updateData.minPrice)) {
        newPrice = parseFloat(updateData.minPrice);
      }
      if (updateData.maxPrice && newPrice > parseFloat(updateData.maxPrice)) {
        newPrice = parseFloat(updateData.maxPrice);
      }

      // Round to 2 decimal places
      newPrice = Math.round(newPrice * 100) / 100;
      
      // Only update if price actually changed
      if (Math.abs(newPrice - originalPrice) > 0.01) {
        const productIndex = this.products.findIndex(p => p.id === product.id);
        if (productIndex !== -1) {
          this.products[productIndex] = {
            ...this.products[productIndex],
            previousPrice: originalPrice,
            price: newPrice
          };
          updatedCount++;
        }
      }
    });

    return {
      updatedCount,
      totalFiltered: filteredProducts.length,
      strategy: updateData.strategy
    };
  }

  validateBulkPriceUpdate(updateData) {
    if (!updateData.strategy) {
      return { isValid: false, error: 'Update strategy is required' };
    }

    if (updateData.strategy === 'range') {
      if (!updateData.minPrice || !updateData.maxPrice) {
        return { isValid: false, error: 'Both minimum and maximum prices are required for range strategy' };
      }
      if (parseFloat(updateData.minPrice) >= parseFloat(updateData.maxPrice)) {
        return { isValid: false, error: 'Minimum price must be less than maximum price' };
      }
    } else {
      if (!updateData.value) {
        return { isValid: false, error: 'Update value is required' };
      }
      if (isNaN(parseFloat(updateData.value))) {
        return { isValid: false, error: 'Update value must be a valid number' };
      }
    }

    return { isValid: true };
  }

delay(ms = 150) { // Reduced delay for faster perceived performance
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // Calculate profit metrics for a product
  calculateProfitMetrics(productData) {
    const price = parseFloat(productData.price) || 0;
    const purchasePrice = parseFloat(productData.purchasePrice) || 0;
    const discountValue = parseFloat(productData.discountValue) || 0;
    
    let finalPrice = price;
    
    // Apply discount based on type
    if (discountValue > 0) {
      if (productData.discountType === 'Percentage') {
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
      minSellingPrice: Math.round(minSellingPrice * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      finalPrice: Math.round(finalPrice * 100) / 100
    };
  }
  
  // Enhanced profit metrics calculation with error handling
  getDisplayMetrics(product) {
    try {
      if (!product || typeof product !== 'object') {
        return null;
      }

      const metrics = this.calculateProfitMetrics(product);
      
      return {
        ...metrics,
        hasMetrics: !!(product.profitMargin || product.minSellingPrice || product.purchasePrice),
        isHealthyMargin: parseFloat(product.profitMargin || 0) > 15,
        isProfitable: parseFloat(product.profitMargin || 0) > 0
      };
    } catch (error) {
      console.error('Error calculating display metrics:', error);
      return null;
    }
  }

  // Validate business rules for product pricing
  validateProfitRules(productData) {
    try {
      const purchasePrice = parseFloat(productData.purchasePrice) || 0;
      const price = parseFloat(productData.price) || 0;
      
      if (purchasePrice > 0 && price <= purchasePrice) {
        return {
          isValid: false,
          error: 'Selling price must be greater than purchase price'
        };
      }

      // Additional validation for minimum profit margin
      if (purchasePrice > 0) {
        const margin = ((price - purchasePrice) / purchasePrice) * 100;
        if (margin < 5) {
          return {
            isValid: false,
            error: 'Profit margin should be at least 5% for sustainable business'
          };
        }
      }
      
      return { isValid: true };
    } catch (error) {
      console.error('Error validating profit rules:', error);
      return {
        isValid: false,
        error: 'Unable to validate pricing rules'
      };
    }
  }

  // Get financial health indicator
  getFinancialHealth(product) {
    try {
      if (!product) return 'unknown';
      
      const margin = parseFloat(product.profitMargin || 0);
      
      if (margin >= 25) return 'excellent';
      if (margin >= 15) return 'good';
      if (margin >= 5) return 'fair';
      if (margin > 0) return 'poor';
      return 'loss';
    } catch (error) {
      console.error('Error calculating financial health:', error);
      return 'unknown';
    }
}

  // Image validation and processing methods
  async validateImage(file) {
    try {
      // Basic file validation
      if (!file || !file.type.startsWith('image/')) {
        return { isValid: false, error: 'Please select a valid image file' };
      }
      
      // Size validation
      if (file.size > 10 * 1024 * 1024) {
        return { isValid: false, error: 'Image file size must be less than 10MB' };
      }
      
      // Create image element for quality analysis
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          // Basic quality checks
          if (img.width < 200 || img.height < 200) {
            resolve({ isValid: false, error: 'Image resolution too low. Minimum 200x200px required' });
            return;
          }
          
          // Check for excessive blur (simplified)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const variance = this.calculateImageVariance(imageData.data);
          
          if (variance < 100) {
            resolve({ isValid: false, error: 'Image appears to be too blurry or low quality' });
            return;
          }
          
          resolve({ isValid: true });
        };
        
        img.onerror = () => {
          resolve({ isValid: false, error: 'Invalid or corrupted image file' });
        };
        
        img.src = URL.createObjectURL(file);
      });
      
    } catch (error) {
      console.error('Error validating image:', error);
      return { isValid: false, error: 'Failed to validate image' };
    }
  }

  // Calculate image variance for quality assessment
  calculateImageVariance(imageData) {
    let sum = 0;
    let sumSquared = 0;
    const length = imageData.length;
    
    for (let i = 0; i < length; i += 4) {
      const gray = 0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2];
      sum += gray;
      sumSquared += gray * gray;
    }
    
    const mean = sum / (length / 4);
    const variance = (sumSquared / (length / 4)) - (mean * mean);
    return variance;
  }

  // Process and optimize image
  async processImage(file, options = {}) {
    try {
      const {
        targetSize = { width: 600, height: 600 },
        maxFileSize = 100 * 1024, // 100KB
        quality = 0.9
      } = options;
      
      return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        img.onload = () => {
          // Calculate dimensions maintaining aspect ratio
          let { width, height } = this.calculateOptimalDimensions(
            img.width, 
            img.height, 
            targetSize.width, 
            targetSize.height
          );
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with compression
          canvas.toBlob((blob) => {
            if (blob.size <= maxFileSize) {
              const url = URL.createObjectURL(blob);
              resolve({ url, blob, size: blob.size });
            } else {
              // Reduce quality if file is too large
              const reducedQuality = Math.max(0.1, quality - 0.2);
              canvas.toBlob((reducedBlob) => {
                const url = URL.createObjectURL(reducedBlob);
                resolve({ url, blob: reducedBlob, size: reducedBlob.size });
              }, 'image/webp', reducedQuality);
            }
          }, 'image/webp', quality);
        };
        
        img.onerror = () => reject(new Error('Failed to process image'));
        img.src = URL.createObjectURL(file);
      });
      
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error('Failed to process image');
    }
  }

  // Calculate optimal dimensions for image resizing
  calculateOptimalDimensions(originalWidth, originalHeight, targetWidth, targetHeight) {
    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = targetWidth / targetHeight;
    
    let width, height;
    
    if (aspectRatio > targetAspectRatio) {
      // Image is wider than target
      width = targetWidth;
      height = targetWidth / aspectRatio;
    } else {
      // Image is taller than target
      height = targetHeight;
      width = targetHeight * aspectRatio;
    }
    
    return { width: Math.round(width), height: Math.round(height) };
  }

  // Search images from multiple sources
  async searchImages(query) {
    try {
      await this.delay(1000); // Simulate API call
      
      const results = [];
      
      // Search internal product database
      const internalResults = this.searchInternalImages(query);
      results.push(...internalResults);
      
      // Search Unsplash API (simulated)
      const unsplashResults = this.searchUnsplashImages(query);
      results.push(...unsplashResults);
      
      return results.slice(0, 12); // Return max 12 results
      
    } catch (error) {
      console.error('Error searching images:', error);
      throw new Error('Failed to search images');
    }
  }

  // Search internal product images
  searchInternalImages(query) {
    const mockInternalImages = [
      {
        url: "/api/placeholder/600/600",
        thumbnail: "/api/placeholder/200/200",
        description: `Fresh ${query}`,
        source: 'internal'
      },
      {
        url: "/api/placeholder/600/600",
        thumbnail: "/api/placeholder/200/200", 
        description: `Organic ${query}`,
        source: 'internal'
      }
    ];
    
    return mockInternalImages;
  }

  // Search Unsplash images (simulated)
  searchUnsplashImages(query) {
    const mockUnsplashImages = [
      {
        url: "/api/placeholder/600/600",
        thumbnail: "/api/placeholder/200/200",
        description: `Premium ${query}`,
        source: 'unsplash'
      },
      {
        url: "/api/placeholder/600/600",
        thumbnail: "/api/placeholder/200/200",
        description: `Fresh ${query}`,
        source: 'unsplash'
      },
      {
        url: "/api/placeholder/600/600", 
        thumbnail: "/api/placeholder/200/200",
        description: `Natural ${query}`,
        source: 'unsplash'
      }
    ];
    
    return mockUnsplashImages;
  }
}

export const productService = new ProductService();