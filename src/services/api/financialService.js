import { productService } from './productService';
import { orderService } from './orderService';

class FinancialService {
  constructor() {
    this.financialData = [];
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

  delay(ms = 300) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const financialService = new FinancialService();