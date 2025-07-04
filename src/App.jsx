import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Layout from '@/components/organisms/Layout';
import Home from '@/components/pages/Home';
import Category from '@/components/pages/Category';
import ProductDetail from '@/components/pages/ProductDetail';
import Cart from '@/components/pages/Cart';
import Checkout from '@/components/pages/Checkout';
import Orders from '@/components/pages/Orders';
import OrderTracking from '@/components/pages/OrderTracking';
import AdminDashboard from '@/components/pages/AdminDashboard';
import ProductManagement from '@/components/pages/ProductManagement';
import POS from '@/components/pages/POS';
import DeliveryTracking from '@/components/pages/DeliveryTracking';
import Analytics from '@/components/pages/Analytics';
import Account from '@/components/pages/Account';
function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="category/:categoryName" element={<Category />} />
            <Route path="product/:productId" element={<ProductDetail />} />
            <Route path="cart" element={<Cart />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:orderId" element={<OrderTracking />} />
            <Route path="account" element={<Account />} />
<Route path="admin" element={<AdminDashboard />} />
            <Route path="admin/products" element={<ProductManagement />} />
            <Route path="admin/pos" element={<POS />} />
            <Route path="admin/delivery-dashboard" element={<DeliveryTracking />} />
            <Route path="admin/analytics" element={<Analytics />} />
          </Route>
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          style={{ zIndex: 9999 }}
        />
      </div>
    </Router>
  );
}

export default App;