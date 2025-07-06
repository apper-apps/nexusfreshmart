import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "react-toastify";
import ApperIcon from "@/components/ApperIcon";
import Button from "@/components/atoms/Button";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import Orders from "@/components/pages/Orders";
import { orderService } from "@/services/api/orderService";
import { productService } from "@/services/api/productService";
import { paymentService } from "@/services/api/paymentService";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    walletBalance: 0,
    totalTransactions: 0,
    monthlyRevenue: 0,
    pendingVerifications: 0
  })
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [todayOrders, setTodayOrders] = useState([])
  const [todayRevenue, setTodayRevenue] = useState(0)
  const [walletTransactions, setWalletTransactions] = useState([])
  const [revenueByMethod, setRevenueByMethod] = useState({})
  const [sortedOrders, setSortedOrders] = useState([])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load all dashboard data
      const products = await productService.getAll()
      const orders = await orderService.getAll()
      
      // Calculate low stock products
      const lowStock = products.filter(p => p.stock < 10)
      setLowStockProducts(lowStock)
      
      // Calculate today's orders and revenue
      const today = new Date()
      const todayOrdersData = orders.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate.toDateString() === today.toDateString()
      })
      setTodayOrders(todayOrdersData)
      
      const todayRevenueAmount = todayOrdersData.reduce((sum, order) => sum + order.total, 0)
      setTodayRevenue(todayRevenueAmount)
      
      // Load wallet data and other stats
      const walletBalance = await paymentService.getWalletBalance()
      const walletTransactionsData = await paymentService.getWalletTransactions()
      const monthlyRevenue = await orderService.getMonthlyRevenue()
      const pendingVerifications = await orderService.getPendingVerifications()
      
      // Update stats object
      setStats({
        walletBalance: walletBalance || 0,
        totalTransactions: walletTransactionsData?.length || 0,
        monthlyRevenue: monthlyRevenue || 0,
        pendingVerifications: pendingVerifications || 0
      })
      
setWalletTransactions(walletTransactionsData || [])
      
      // Calculate revenue by payment method
      const revenueByMethodData = await orderService.getRevenueByPaymentMethod()
      setRevenueByMethod(revenueByMethodData || {})
      
      // Process revenue breakdown for display
      const breakdown = Object.entries(revenueByMethodData || {}).map(([method, amount]) => ({
        method,
        amount,
        percentage: Math.round((amount / (monthlyRevenue || 1)) * 100)
      }))
      setRevenueBreakdown(breakdown)
      
      // Sort orders by date and set recent orders
      const sortedOrdersData = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setSortedOrders(sortedOrdersData)
      setRecentOrders(sortedOrdersData.slice(0, 5))
      
      // Update stats with calculated values
      setStats(prevStats => ({
        ...prevStats,
        totalProducts: products.length,
        totalOrders: orders.length,
        lowStockProducts: lowStock.length,
        todayRevenue: todayRevenueAmount
      }))
      setLoading(false)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
      setStats({
        walletBalance: 0,
        totalTransactions: 0,
        monthlyRevenue: 0,
        pendingVerifications: 0
      })
      setLoading(false)
    }
}

  useEffect(() => {
    loadDashboardData()
  }, [])

  // Add missing state variables
  const [walletLoading, setWalletLoading] = useState(false)
  const [recentOrders, setRecentOrders] = useState([])
  const [revenueBreakdown, setRevenueBreakdown] = useState([])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Loading type="dashboard" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Error message={error} onRetry={loadDashboardData} />
      </div>
    );
  }

const handleWalletAction = async (action, amount = 0) => {
    setWalletLoading(true);
    try {
      let result;
      switch (action) {
        case 'deposit':
          result = await paymentService.depositToWallet(amount);
          toast.success(`Deposited Rs. ${amount.toLocaleString()} to wallet`);
          break;
        case 'withdraw':
          result = await paymentService.withdrawFromWallet(amount);
          toast.success(`Withdrew Rs. ${amount.toLocaleString()} from wallet`);
          break;
        case 'transfer':
          result = await paymentService.transferFromWallet(amount);
          toast.success(`Transferred Rs. ${amount.toLocaleString()} from wallet`);
          break;
        default:
          break;
      }
      loadDashboardData(); // Refresh data
    } catch (error) {
      toast.error(error.message || 'Wallet operation failed');
    } finally {
      setWalletLoading(false);
    }
  };

const quickActions = [
    { label: 'Manage Products', path: '/admin/products', icon: 'Package', color: 'from-blue-500 to-cyan-500' },
    { label: 'POS Terminal', path: '/admin/pos', icon: 'Calculator', color: 'from-green-500 to-emerald-500' },
    { label: 'View Orders', path: '/orders', icon: 'ShoppingCart', color: 'from-purple-500 to-pink-500' },
    { label: 'Financial Dashboard', path: '/admin/financial-dashboard', icon: 'DollarSign', color: 'from-emerald-500 to-teal-500' },
    { label: 'Payment Verification', path: '/admin/payments?tab=verification', icon: 'Shield', color: 'from-orange-500 to-red-500' },
    { label: 'Payment Management', path: '/admin/payments', icon: 'CreditCard', color: 'from-teal-500 to-cyan-500' },
    { label: 'Delivery Tracking', path: '/admin/delivery-dashboard', icon: 'MapPin', color: 'from-indigo-500 to-purple-500' },
    { label: 'Analytics', path: '/admin/analytics', icon: 'TrendingUp', color: 'from-amber-500 to-orange-500' }
  ];
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your FreshMart store</p>
      </div>

{/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="Package" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold">{stats.totalOrders}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="ShoppingCart" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock Items</p>
              <p className="text-3xl font-bold">{stats.lowStockProducts}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="AlertTriangle" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Today's Revenue</p>
              <p className="text-3xl font-bold">Rs. {stats.todayRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="DollarSign" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Wallet Balance</p>
              <p className="text-3xl font-bold">Rs. {stats.walletBalance.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="Wallet" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-100 text-sm font-medium">Total Transactions</p>
              <p className="text-3xl font-bold">{stats.totalTransactions}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="CreditCard" size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 bg-gradient-to-r from-emerald-500 to-green-500 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Monthly Revenue</p>
              <p className="text-3xl font-bold">Rs. {stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-lg">
              <ApperIcon name="TrendingUp" size={24} />
            </div>
          </div>
        </div>
      </div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Quick Actions */}
        <div className="card p-6">
<h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="group"
              >
                <div className="p-4 rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`bg-gradient-to-r ${action.color} p-2 rounded-lg`}>
                      <ApperIcon name={action.icon} size={20} className="text-white" />
                    </div>
                    <span className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      {action.label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        {/* Recent Orders */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <Link to="/orders" className="text-primary hover:text-primary-dark transition-colors">
              View All
            </Link>
          </div>
          
          {recentOrders.length === 0 ? (
            <div className="text-center py-8">
              <ApperIcon name="Package" size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent orders</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-2 rounded-lg">
                      <ApperIcon name="Package" size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(order.createdAt), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Rs. {order.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Wallet Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Wallet Actions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Management</h2>
          <div className="space-y-4">
            <Button
              onClick={() => handleWalletAction('deposit', 5000)}
              disabled={walletLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              <ApperIcon name="Plus" size={16} className="mr-2" />
              Deposit Rs. 5,000
            </Button>
            <Button
              onClick={() => handleWalletAction('withdraw', 1000)}
              disabled={walletLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
            >
              <ApperIcon name="Minus" size={16} className="mr-2" />
              Withdraw Rs. 1,000
            </Button>
            <Button
              onClick={() => handleWalletAction('transfer', 2000)}
              disabled={walletLoading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              <ApperIcon name="Send" size={16} className="mr-2" />
              Transfer Rs. 2,000
            </Button>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue by Payment Method</h2>
          {revenueBreakdown.length === 0 ? (
            <div className="text-center py-8">
              <ApperIcon name="PieChart" size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No revenue data</p>
            </div>
          ) : (
            <div className="space-y-3">
              {revenueBreakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary p-2 rounded-lg">
                      <ApperIcon name="CreditCard" size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{item.method}</p>
                      <p className="text-sm text-gray-600">{item.percentage}% of total</p>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">Rs. {item.amount.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Wallet Transactions */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Wallet Transactions</h2>
          {walletTransactions.length === 0 ? (
            <div className="text-center py-8">
              <ApperIcon name="Wallet" size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No wallet transactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletTransactions.map((transaction) => (
                <div key={transaction.Id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'deposit' ? 'bg-green-100' : 
                      transaction.type === 'withdraw' ? 'bg-red-100' : 'bg-blue-100'
                    }`}>
                      <ApperIcon 
                        name={transaction.type === 'deposit' ? 'ArrowDown' : 
                              transaction.type === 'withdraw' ? 'ArrowUp' : 'ArrowRight'} 
                        size={16} 
                        className={
                          transaction.type === 'deposit' ? 'text-green-600' : 
                          transaction.type === 'withdraw' ? 'text-red-600' : 'text-blue-600'
                        } 
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{transaction.type}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(transaction.timestamp), 'MMM dd, hh:mm a')}
                      </p>
                    </div>
                  </div>
                  <p className={`font-medium ${
                    transaction.type === 'deposit' ? 'text-green-600' : 
                    transaction.type === 'withdraw' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {transaction.type === 'deposit' ? '+' : '-'}Rs. {transaction.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="card p-6 mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Database</p>
              <p className="text-sm text-green-600">Connected</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Payment Gateway</p>
              <p className="text-sm text-green-600">Active</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <ApperIcon name="CheckCircle" size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Inventory Sync</p>
              <p className="text-sm text-green-600">Up to date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;