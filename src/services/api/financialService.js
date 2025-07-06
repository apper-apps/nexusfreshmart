import { productService } from "@/services/api/productService";
import { orderService } from "@/services/api/orderService";

// Mock expense data with proper Id structure
const mockExpenses = [
  {
    Id: 1,
    amount: 25000,
    vendor: 'City Landlord',
    category: 'Rent',
    description: 'Monthly office rent',
    date: '2024-01-15',
    receiptUrl: null,
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    Id: 2,
    amount: 45000,
    vendor: 'Staff Payroll',
    category: 'Salaries',
    description: 'Monthly staff salaries',
    date: '2024-01-01',
    receiptUrl: null,
    createdAt: '2024-01-01T09:00:00Z'
  },
  {
    Id: 3,
    amount: 2500,
    vendor: 'Metro Transport',
    category: 'Transportation',
    description: 'Business travel expenses',
    date: '2024-01-10',
    receiptUrl: null,
    createdAt: '2024-01-10T14:30:00Z'
  },
  {
    Id: 4,
    amount: 3200,
    vendor: 'City Power Co',
    category: 'Utilities',
    description: 'Electricity bill',
    date: '2024-01-05',
    receiptUrl: null,
    createdAt: '2024-01-05T11:15:00Z'
  },
  {
    Id: 5,
    amount: 8000,
    vendor: 'Digital Marketing Co',
    category: 'Marketing',
    description: 'Facebook and Google ads',
    date: '2024-01-12',
    receiptUrl: null,
    createdAt: '2024-01-12T16:45:00Z'
  }
];

// Mock vendor data with proper Id structure
const mockVendors = [
  {
    Id: 1,
    name: 'ABC Suppliers Ltd',
    email: 'billing@abcsuppliers.com',
    phone: '+92-300-1234567',
    category: 'Supplier',
    paymentTerms: 30,
    address: '123 Industrial Area, Karachi',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    Id: 2,
    name: 'TechFlow Solutions',
    email: 'accounts@techflow.pk',
    phone: '+92-321-9876543',
    category: 'Service Provider',
    paymentTerms: 15,
    address: '456 IT Park, Lahore',
    createdAt: '2024-01-05T00:00:00Z'
  },
  {
    Id: 3,
    name: 'City Power Company',
    email: 'billing@citypower.gov.pk',
    phone: '+92-42-1234567',
    category: 'Utility',
    paymentTerms: 15,
    address: 'Power House Road, Islamabad',
    createdAt: '2024-01-10T00:00:00Z'
  },
  {
    Id: 4,
    name: 'Fresh Produce Traders',
    email: 'orders@freshproduce.pk',
    phone: '+92-333-7654321',
    category: 'Supplier',
    paymentTerms: 7,
    address: 'Fruit Market, Multan',
    createdAt: '2024-01-15T00:00:00Z'
  }
];

// Mock vendor payments with due dates
const mockVendorPayments = [
  {
    Id: 1,
    vendorId: 1,
    amount: 150000,
    description: 'Monthly supplies invoice #INV-2024-001',
    dueDate: '2024-02-15',
    invoiceNumber: 'INV-2024-001',
    status: 'pending',
    createdAt: '2024-01-16T10:00:00Z'
  },
  {
    Id: 2,
    vendorId: 2,
    amount: 85000,
    description: 'Website maintenance Q1 2024',
    dueDate: '2024-02-01',
    invoiceNumber: 'TF-001-2024',
    status: 'paid',
    paidAt: '2024-01-28T14:30:00Z',
    createdAt: '2024-01-17T09:00:00Z'
  },
  {
    Id: 3,
    vendorId: 3,
    amount: 25000,
    description: 'Electricity bill January 2024',
    dueDate: '2024-02-10',
    invoiceNumber: 'PWR-JAN-2024',
    status: 'overdue',
    createdAt: '2024-01-26T16:00:00Z'
  },
  {
    Id: 4,
    vendorId: 4,
    amount: 45000,
    description: 'Fresh fruits weekly supply',
    dueDate: '2024-02-05',
    invoiceNumber: 'FP-W1-2024',
    status: 'pending',
    createdAt: '2024-01-29T08:00:00Z'
  },
  {
    Id: 5,
    vendorId: 1,
    amount: 75000,
    description: 'Equipment maintenance',
    dueDate: '2024-02-20',
    invoiceNumber: 'INV-2024-002',
    status: 'pending',
    createdAt: '2024-01-30T11:00:00Z'
  }
];

const expenseCategories = [
  { Id: 1, name: 'Rent', icon: 'Home', color: '#EF4444' },
  { Id: 2, name: 'Salaries', icon: 'Users', color: '#3B82F6' },
  { Id: 3, name: 'Transportation', icon: 'Car', color: '#10B981' },
  { Id: 4, name: 'Utilities', icon: 'Zap', color: '#F59E0B' },
  { Id: 5, name: 'Marketing', icon: 'Megaphone', color: '#8B5CF6' },
  { Id: 6, name: 'Office Supplies', icon: 'Package', color: '#06B6D4' },
  { Id: 7, name: 'Equipment', icon: 'Monitor', color: '#84CC16' },
  { Id: 8, name: 'Insurance', icon: 'Shield', color: '#EC4899' },
  { Id: 9, name: 'Professional Services', icon: 'Briefcase', color: '#F97316' },
  { Id: 10, name: 'Travel', icon: 'Plane', color: '#6366F1' },
  { Id: 11, name: 'Maintenance', icon: 'Wrench', color: '#14B8A6' },
  { Id: 12, name: 'Other', icon: 'MoreHorizontal', color: '#6B7280' }
];

class FinancialService {
  constructor() {
    this.financialData = [];
    this.expenses = [...mockExpenses];
    this.expenseIdCounter = Math.max(...mockExpenses.map(e => e.Id), 0) + 1;
    this.vendors = [...mockVendors];
    this.vendorIdCounter = Math.max(...mockVendors.map(v => v.Id), 0) + 1;
    this.vendorPayments = [...mockVendorPayments];
    this.vendorPaymentIdCounter = Math.max(...mockVendorPayments.map(p => p.Id), 0) + 1;
  }

  async getFinancialMetrics(days = 30) {
    await this.delay();
    
    try {
      const [products, orders] = await Promise.all([
        productService.getAll(),
        orderService.getAll()
      ]);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= startDate && orderDate <= endDate;
      });

      return this.calculateFinancialMetrics(products, filteredOrders);
    } catch (error) {
      throw new Error('Failed to calculate financial metrics: ' + error.message);
    }
  }

  calculateFinancialMetrics(products, orders) {
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalItems = 0;

    const productMetrics = {};
    const categoryMetrics = {};

    orders.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            const quantity = item.quantity || 0;
            const sellingPrice = product.price || 0;
            const purchasePrice = product.purchasePrice || 0;
            
            const itemRevenue = sellingPrice * quantity;
            const itemCost = purchasePrice * quantity;
            const itemProfit = itemRevenue - itemCost;

            totalRevenue += itemRevenue;
            totalCost += itemCost;
            totalProfit += itemProfit;
            totalItems += quantity;

            // Product-level metrics
            if (!productMetrics[product.id]) {
              productMetrics[product.id] = {
                Id: product.id,
                name: product.name,
                category: product.category,
                totalSold: 0,
                revenue: 0,
                cost: 0,
                profit: 0,
                profitMargin: 0
              };
            }

            productMetrics[product.id].totalSold += quantity;
            productMetrics[product.id].revenue += itemRevenue;
            productMetrics[product.id].cost += itemCost;
            productMetrics[product.id].profit += itemProfit;
            productMetrics[product.id].profitMargin = 
              productMetrics[product.id].revenue > 0 
                ? (productMetrics[product.id].profit / productMetrics[product.id].revenue) * 100 
                : 0;

            // Category-level metrics
            const category = product.category || 'Uncategorized';
            if (!categoryMetrics[category]) {
              categoryMetrics[category] = {
                Id: category,
                name: category,
                revenue: 0,
                cost: 0,
                profit: 0,
                profitMargin: 0,
                productCount: new Set()
              };
            }

            categoryMetrics[category].revenue += itemRevenue;
            categoryMetrics[category].cost += itemCost;
            categoryMetrics[category].profit += itemProfit;
            categoryMetrics[category].productCount.add(product.id);
            categoryMetrics[category].profitMargin = 
              categoryMetrics[category].revenue > 0 
                ? (categoryMetrics[category].profit / categoryMetrics[category].revenue) * 100 
                : 0;
          }
        });
      }
    });

    // Convert sets to counts for category metrics
    Object.values(categoryMetrics).forEach(category => {
      category.productCount = category.productCount.size;
    });

    const overallProfitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    const roi = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    return {
      summary: {
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: overallProfitMargin,
        roi,
        averageOrderValue,
        totalOrders: orders.length,
        totalItems
      },
      productMetrics: Object.values(productMetrics),
      categoryMetrics: Object.values(categoryMetrics)
    };
  }

  async getProductProfitability(productId) {
    await this.delay();
    
    try {
      const [product, orders] = await Promise.all([
        productService.getById(productId),
        orderService.getAll()
      ]);

      const productOrders = orders.filter(order => 
        order.items && order.items.some(item => item.productId === productId)
      );

      let totalRevenue = 0;
      let totalCost = 0;
      let totalQuantitySold = 0;

      productOrders.forEach(order => {
        const productItems = order.items.filter(item => item.productId === productId);
        productItems.forEach(item => {
          const quantity = item.quantity || 0;
          const revenue = product.price * quantity;
          const cost = (product.purchasePrice || 0) * quantity;
          
          totalRevenue += revenue;
          totalCost += cost;
          totalQuantitySold += quantity;
        });
      });

      const profit = totalRevenue - totalCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const roi = totalCost > 0 ? (profit / totalCost) * 100 : 0;

      return {
        Id: productId,
        productName: product.name,
        totalRevenue,
        totalCost,
        totalProfit: profit,
        profitMargin,
        roi,
        totalQuantitySold,
        averageSellingPrice: totalQuantitySold > 0 ? totalRevenue / totalQuantitySold : 0,
        averageCost: totalQuantitySold > 0 ? totalCost / totalQuantitySold : 0
      };
    } catch (error) {
      throw new Error('Failed to get product profitability: ' + error.message);
    }
  }

  async getCategoryProfitability() {
    await this.delay();
    
    try {
      const [products, orders] = await Promise.all([
        productService.getAll(),
        orderService.getAll()
      ]);

      const categoryData = {};

      orders.forEach(order => {
        if (order.items) {
          order.items.forEach(item => {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              const category = product.category || 'Uncategorized';
              const quantity = item.quantity || 0;
              const revenue = product.price * quantity;
              const cost = (product.purchasePrice || 0) * quantity;

              if (!categoryData[category]) {
                categoryData[category] = {
                  Id: category,
                  categoryName: category,
                  revenue: 0,
                  cost: 0,
                  profit: 0,
                  productCount: new Set(),
                  totalQuantitySold: 0
                };
              }

              categoryData[category].revenue += revenue;
              categoryData[category].cost += cost;
              categoryData[category].profit += (revenue - cost);
              categoryData[category].productCount.add(product.id);
              categoryData[category].totalQuantitySold += quantity;
            }
          });
        }
      });

      return Object.values(categoryData).map(category => ({
        ...category,
        productCount: category.productCount.size,
        profitMargin: category.revenue > 0 ? (category.profit / category.revenue) * 100 : 0,
        roi: category.cost > 0 ? (category.profit / category.cost) * 100 : 0,
        averageRevenuePerProduct: category.productCount.size > 0 ? category.revenue / category.productCount.size : 0
      }));
    } catch (error) {
      throw new Error('Failed to get category profitability: ' + error.message);
    }
  }

  async getProfitTrends(days = 30) {
    await this.delay();
    
    try {
      const [products, orders] = await Promise.all([
        productService.getAll(),
        orderService.getAll()
      ]);

      const trends = [];
      const endDate = new Date();

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(endDate.getDate() - i);
        const dateString = date.toISOString().split('T')[0];

        const dayOrders = orders.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate.toISOString().split('T')[0] === dateString;
        });

        let dayRevenue = 0;
        let dayCost = 0;

        dayOrders.forEach(order => {
          if (order.items) {
            order.items.forEach(item => {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                const quantity = item.quantity || 0;
                dayRevenue += product.price * quantity;
                dayCost += (product.purchasePrice || 0) * quantity;
              }
            });
          }
        });

        const dayProfit = dayRevenue - dayCost;
        const dayProfitMargin = dayRevenue > 0 ? (dayProfit / dayRevenue) * 100 : 0;

        trends.push({
          Id: dateString,
          date: dateString,
          revenue: dayRevenue,
          cost: dayCost,
          profit: dayProfit,
          profitMargin: dayProfitMargin,
          orderCount: dayOrders.length
        });
      }

      return trends;
    } catch (error) {
      throw new Error('Failed to get profit trends: ' + error.message);
    }
  }

  async getFinancialHealth() {
    await this.delay();
    
    try {
      const [products, metrics] = await Promise.all([
        productService.getAll(),
        this.getFinancialMetrics(30)
      ]);

      const profitableProducts = products.filter(product => {
        const margin = parseFloat(product.profitMargin || 0);
        return margin > 0;
      });

      const highMarginProducts = products.filter(product => {
        const margin = parseFloat(product.profitMargin || 0);
        return margin >= 25;
      });

      const lowMarginProducts = products.filter(product => {
        const margin = parseFloat(product.profitMargin || 0);
        return margin > 0 && margin < 10;
      });

      const lossProducts = products.filter(product => {
        const margin = parseFloat(product.profitMargin || 0);
        return margin < 0;
      });

      return {
        Id: 'financial-health',
        totalProducts: products.length,
        profitableProducts: profitableProducts.length,
        highMarginProducts: highMarginProducts.length,
        lowMarginProducts: lowMarginProducts.length,
        lossProducts: lossProducts.length,
        averageProfitMargin: metrics.summary.profitMargin,
        overallRoi: metrics.summary.roi,
        healthScore: this.calculateHealthScore(products, metrics),
        recommendations: this.generateRecommendations(products, metrics)
      };
    } catch (error) {
      throw new Error('Failed to assess financial health: ' + error.message);
    }
  }

  calculateHealthScore(products, metrics) {
    let score = 0;
    
    // Profit margin contribution (40%)
    const profitMargin = metrics.summary.profitMargin;
    if (profitMargin >= 25) score += 40;
    else if (profitMargin >= 15) score += 30;
    else if (profitMargin >= 10) score += 20;
    else if (profitMargin >= 5) score += 10;
    
    // Product profitability distribution (30%)
    const profitableRatio = products.filter(p => parseFloat(p.profitMargin || 0) > 0).length / products.length;
    score += profitableRatio * 30;
    
    // ROI contribution (20%)
    const roi = metrics.summary.roi;
    if (roi >= 50) score += 20;
    else if (roi >= 30) score += 15;
    else if (roi >= 20) score += 10;
    else if (roi >= 10) score += 5;
    
    // Revenue stability (10%)
    if (metrics.summary.totalRevenue > 0 && metrics.summary.totalOrders > 0) {
      score += 10;
    }
    
    return Math.round(score);
  }

  generateRecommendations(products, metrics) {
    const recommendations = [];
    
    // Low margin products
    const lowMarginProducts = products.filter(p => {
      const margin = parseFloat(p.profitMargin || 0);
      return margin > 0 && margin < 10;
    });
    
    if (lowMarginProducts.length > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Low Margin Products',
        message: `${lowMarginProducts.length} products have margins below 10%. Consider repricing or cost optimization.`,
        action: 'Review pricing strategy'
      });
    }
    
    // Loss-making products
    const lossProducts = products.filter(p => parseFloat(p.profitMargin || 0) < 0);
    if (lossProducts.length > 0) {
      recommendations.push({
        type: 'error',
        title: 'Loss-Making Products',
        message: `${lossProducts.length} products are selling at a loss. Immediate action required.`,
        action: 'Increase prices or reduce costs'
      });
    }
    
    // Overall profitability
    if (metrics.summary.profitMargin < 15) {
      recommendations.push({
        type: 'info',
        title: 'Improve Overall Profitability',
        message: 'Overall profit margin is below industry standards. Focus on high-margin products.',
        action: 'Optimize product mix'
      });
    }
    
    return recommendations;
  }
// Expense Management Methods
  async getExpenses(days = 30) {
    await this.delay();
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const filteredExpenses = this.expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

      return [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      throw new Error('Failed to get expenses: ' + error.message);
    }
  }

  async getExpenseById(id) {
    await this.delay();
    
    try {
      const expense = this.expenses.find(e => e.Id === parseInt(id));
      if (!expense) {
        throw new Error('Expense not found');
      }
      return { ...expense };
    } catch (error) {
      throw new Error('Failed to get expense: ' + error.message);
    }
  }

  async createExpense(expenseData) {
    await this.delay();
    
    try {
      const newExpense = {
        Id: this.expenseIdCounter++,
        amount: parseFloat(expenseData.amount),
        vendor: expenseData.vendor,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
        receiptUrl: expenseData.receiptUrl || null,
        createdAt: new Date().toISOString()
      };

      this.expenses.push(newExpense);
      return { ...newExpense };
    } catch (error) {
      throw new Error('Failed to create expense: ' + error.message);
    }
  }

  async updateExpense(id, expenseData) {
    await this.delay();
    
    try {
      const index = this.expenses.findIndex(e => e.Id === parseInt(id));
      if (index === -1) {
        throw new Error('Expense not found');
      }

      const updatedExpense = {
        ...this.expenses[index],
        amount: parseFloat(expenseData.amount),
        vendor: expenseData.vendor,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date,
        receiptUrl: expenseData.receiptUrl || this.expenses[index].receiptUrl
      };

      this.expenses[index] = updatedExpense;
      return { ...updatedExpense };
    } catch (error) {
      throw new Error('Failed to update expense: ' + error.message);
    }
  }

  async deleteExpense(id) {
    await this.delay();
    
    try {
      const index = this.expenses.findIndex(e => e.Id === parseInt(id));
      if (index === -1) {
        throw new Error('Expense not found');
      }

      this.expenses.splice(index, 1);
      return { success: true };
    } catch (error) {
      throw new Error('Failed to delete expense: ' + error.message);
    }
  }

  async getExpenseCategories() {
    await this.delay();
    return [...expenseCategories];
  }

  async processReceiptOCR(file) {
    await this.delay(1000); // Simulate OCR processing time
    
    try {
      // Mock OCR processing - in reality, this would use actual OCR service
      const mockOCRResults = [
        {
          success: true,
          amount: 1250.00,
          vendor: 'Tech Store',
          date: new Date().toISOString().split('T')[0],
          category: 'Office Supplies',
          description: 'Computer accessories'
        },
        {
          success: true,
          amount: 450.75,
          vendor: 'Cafe Express',
          date: new Date().toISOString().split('T')[0],
          category: 'Other',
          description: 'Business lunch meeting'
        },
        {
          success: true,
          amount: 2800.00,
          vendor: 'Transport Co',
          date: new Date().toISOString().split('T')[0],
          category: 'Transportation',
          description: 'Business travel'
        }
      ];

      // Return a random mock result
      return mockOCRResults[Math.floor(Math.random() * mockOCRResults.length)];
    } catch (error) {
      throw new Error('Failed to process receipt: ' + error.message);
    }
  }

  async getExpenseAnalytics(days = 30) {
    await this.delay();
    
    try {
      const expenses = await this.getExpenses(days);
      
      // Calculate total expenses
      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      // Calculate monthly average
      const monthlyAverage = days >= 30 ? totalExpenses / (days / 30) : totalExpenses;
      
      // Category breakdown
      const categoryBreakdown = {};
      expenses.forEach(expense => {
        const category = expense.category;
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + expense.amount;
      });
      
      const categoryBreakdownArray = Object.entries(categoryBreakdown)
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
      
      // Top category
      const topCategory = categoryBreakdownArray.length > 0 ? categoryBreakdownArray[0].category : 'N/A';
      
      // Trend data (daily expenses)
      const trendData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayExpenses = expenses.filter(expense => expense.date === dateString);
        const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: dayTotal
        });
      }
      
      return {
        totalExpenses,
        monthlyAverage,
        topCategory,
        categoryBreakdown: categoryBreakdownArray,
        trendData,
        expenseCount: expenses.length,
        averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0
      };
    } catch (error) {
throw new Error('Failed to get expense analytics: ' + error.message);
    }
  }

  // Vendor Management Methods
  async getVendors() {
    await this.delay();
    return [...this.vendors].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getVendorById(id) {
    await this.delay();
    
    try {
      const vendor = this.vendors.find(v => v.Id === parseInt(id));
      if (!vendor) {
        throw new Error('Vendor not found');
      }
      return { ...vendor };
    } catch (error) {
      throw new Error('Failed to get vendor: ' + error.message);
    }
  }

  async createVendor(vendorData) {
    await this.delay();
    
    try {
      const newVendor = {
        Id: this.vendorIdCounter++,
        name: vendorData.name,
        email: vendorData.email,
        phone: vendorData.phone,
        category: vendorData.category,
        paymentTerms: parseInt(vendorData.paymentTerms) || 30,
        address: vendorData.address || '',
        createdAt: new Date().toISOString()
      };

      this.vendors.push(newVendor);
      return { ...newVendor };
    } catch (error) {
      throw new Error('Failed to create vendor: ' + error.message);
    }
  }

  async updateVendor(id, vendorData) {
    await this.delay();
    
    try {
      const index = this.vendors.findIndex(v => v.Id === parseInt(id));
      if (index === -1) {
        throw new Error('Vendor not found');
      }

      const updatedVendor = {
        ...this.vendors[index],
        name: vendorData.name,
        email: vendorData.email,
        phone: vendorData.phone,
        category: vendorData.category,
        paymentTerms: parseInt(vendorData.paymentTerms) || 30,
        address: vendorData.address || ''
      };

      this.vendors[index] = updatedVendor;
      return { ...updatedVendor };
    } catch (error) {
      throw new Error('Failed to update vendor: ' + error.message);
    }
  }

  async deleteVendor(id) {
    await this.delay();
    
    try {
      const index = this.vendors.findIndex(v => v.Id === parseInt(id));
      if (index === -1) {
        throw new Error('Vendor not found');
      }

      // Check for existing payments
      const hasPayments = this.vendorPayments.some(p => p.vendorId === parseInt(id));
      if (hasPayments) {
        throw new Error('Cannot delete vendor with existing payments');
      }

      this.vendors.splice(index, 1);
      return { success: true };
    } catch (error) {
      throw new Error('Failed to delete vendor: ' + error.message);
    }
  }

  // Vendor Payment Methods
  async getVendorPayments(days = 30) {
    await this.delay();
    
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      const filteredPayments = this.vendorPayments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= startDate && paymentDate <= endDate;
      });

      return [...filteredPayments].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } catch (error) {
      throw new Error('Failed to get vendor payments: ' + error.message);
    }
  }

  async processVendorPayment(paymentData) {
    await this.delay();
    
    try {
      const newPayment = {
        Id: this.vendorPaymentIdCounter++,
        vendorId: parseInt(paymentData.vendorId),
        amount: parseFloat(paymentData.amount),
        description: paymentData.description,
        dueDate: paymentData.dueDate,
        invoiceNumber: paymentData.invoiceNumber || '',
        status: paymentData.status || 'pending',
        createdAt: new Date().toISOString()
      };

      this.vendorPayments.push(newPayment);
      return { ...newPayment };
    } catch (error) {
      throw new Error('Failed to process vendor payment: ' + error.message);
    }
  }

  async processBulkVendorPayments(paymentIds) {
    await this.delay(1000); // Simulate bulk processing time
    
    try {
      const processedPayments = [];
      
      for (const paymentId of paymentIds) {
        const index = this.vendorPayments.findIndex(p => p.Id === parseInt(paymentId));
        if (index !== -1) {
          this.vendorPayments[index] = {
            ...this.vendorPayments[index],
            status: 'paid',
            paidAt: new Date().toISOString()
          };
          processedPayments.push(this.vendorPayments[index]);
        }
      }

      return {
        success: true,
        processedCount: processedPayments.length,
        payments: processedPayments
      };
    } catch (error) {
      throw new Error('Failed to process bulk payments: ' + error.message);
    }
  }

  async getVendorPaymentAnalytics(days = 30) {
    await this.delay();
    
    try {
      const payments = await this.getVendorPayments(days);
      
      // Calculate analytics
      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalPending = payments
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalOverdue = payments
        .filter(p => p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date()))
        .reduce((sum, p) => sum + p.amount, 0);

      // Vendor payment breakdown
      const vendorBreakdown = {};
      payments.forEach(payment => {
        const vendorId = payment.vendorId;
        if (!vendorBreakdown[vendorId]) {
          const vendor = this.vendors.find(v => v.Id === vendorId);
          vendorBreakdown[vendorId] = {
            vendorName: vendor?.name || 'Unknown',
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            paymentCount: 0
          };
        }
        
        vendorBreakdown[vendorId].totalAmount += payment.amount;
        vendorBreakdown[vendorId].paymentCount++;
        
        if (payment.status === 'paid') {
          vendorBreakdown[vendorId].paidAmount += payment.amount;
        } else {
          vendorBreakdown[vendorId].pendingAmount += payment.amount;
        }
      });

      // Payment trends (daily breakdown)
      const trendData = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayPayments = payments.filter(payment => 
          payment.paidAt && payment.paidAt.split('T')[0] === dateString
        );
        
        const dayAmount = dayPayments.reduce((sum, payment) => sum + payment.amount, 0);
        
        trendData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: dayAmount,
          count: dayPayments.length
        });
      }

      return {
        totalPaid,
        totalPending,
        totalOverdue,
        paymentCount: payments.length,
        averagePayment: payments.length > 0 ? (totalPaid + totalPending) / payments.length : 0,
        vendorBreakdown: Object.values(vendorBreakdown),
        trendData,
        overdueCount: payments.filter(p => 
          p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date())
        ).length
      };
    } catch (error) {
      throw new Error('Failed to get vendor payment analytics: ' + error.message);
throw new Error('Failed to get vendor payment analytics: ' + error.message);
    }
  }

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}