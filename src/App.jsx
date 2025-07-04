import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Layout from "@/components/organisms/Layout";
import Error from "@/components/ui/Error";
import Analytics from "@/components/pages/Analytics";
import Orders from "@/components/pages/Orders";
import PaymentManagement from "@/components/pages/PaymentManagement";
import Category from "@/components/pages/Category";
import OrderTracking from "@/components/pages/OrderTracking";
import Account from "@/components/pages/Account";
import DeliveryTracking from "@/components/pages/DeliveryTracking";
import POS from "@/components/pages/POS";
import Checkout from "@/components/pages/Checkout";
import Home from "@/components/pages/Home";
import AdminDashboard from "@/components/pages/AdminDashboard";
import ProductDetail from "@/components/pages/ProductDetail";
import Cart from "@/components/pages/Cart";
import ProductManagement from "@/components/pages/ProductManagement";

// Import components

// Pages
function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);

  const checkSDKStatus = () => {
    // Check multiple SDK availability patterns to match main.jsx
    if (window.ApperSDK && window.ApperSDK.isLoaded && (window.Apper || window.ApperSDK || window.apper)) {
      console.log('SDK status check: Ready');
      setSdkReady(true);
      return true;
    } else if (window.ApperSDK && window.ApperSDK.error) {
      console.error('SDK status check: Error', window.ApperSDK.error);
      setSdkError(window.ApperSDK.error);
      return true;
    } else {
      console.log('SDK status check: Not ready yet');
      return false;
    }
  };

  useEffect(() => {
    // Initialize SDK status check
    setSdkReady(false);
    setSdkError(null);
    
    // Check immediately and set up interval
    if (checkSDKStatus()) {
      return; // Already ready or error, no need for interval
    }
    
    const interval = setInterval(() => {
      if (checkSDKStatus()) {
        clearInterval(interval);
      }
    }, 1000);

    // Cleanup with timeout protection
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!sdkReady && !sdkError) {
        setSdkError(new Error('SDK initialization timeout after 30 seconds'));
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Handle canvas-related errors globally
  useEffect(() => {
    const handleCanvasError = (event) => {
      if (event.error && event.error.message && 
          (event.error.message.includes('drawImage') || 
           event.error.message.includes('canvas'))) {
        console.error('Canvas error intercepted:', event.error);
        event.preventDefault();
        
        // Try to recover by reinitializing SDK
        if (window.apperSDK) {
          window.apperSDK.isInitialized = false;
          window.apperSDK.initialize().catch(console.error);
        }
      }
    };

    window.addEventListener('error', handleCanvasError);
    return () => window.removeEventListener('error', handleCanvasError);
  }, []);

  // Provide SDK utilities to components
  const sdkUtils = {
    ready: sdkReady,
    error: sdkError,
    checkStatus: checkSDKStatus
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* SDK Status Indicator (only in development) */}
        {import.meta.env.DEV && (
          <div className="fixed top-0 right-0 z-50 p-2 text-xs">
            <div className={`px-2 py-1 rounded ${
              sdkReady ? 'bg-green-500 text-white' : 
              sdkError ? 'bg-red-500 text-white' : 
              'bg-yellow-500 text-black'
            }`}>
              SDK: {sdkReady ? 'Ready' : sdkError ? 'Error' : 'Loading...'}
            </div>
          </div>
        )}

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
            <Route path="admin/payments" element={<PaymentManagement />} />
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
    </BrowserRouter>
  );
}

export default App;