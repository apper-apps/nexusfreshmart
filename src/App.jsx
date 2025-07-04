import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Layout from "@/components/organisms/Layout";
import Error from "@/components/ui/Error";
import AdminDashboard from "@/components/pages/AdminDashboard";
import ProductDetail from "@/components/pages/ProductDetail";
import Cart from "@/components/pages/Cart";
import ProductManagement from "@/components/pages/ProductManagement";
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

// Import components

function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  
// Enhanced SDK status checking with better error handling
  function checkSDKStatus() {
    try {
      const status = {
        available: typeof window.Apper !== 'undefined',
        initialized: typeof window.Apper?.init === 'function',
        ready: typeof window.Apper !== 'undefined' && typeof window.Apper.init === 'function',
        sdkInstance: typeof window.apperSDK !== 'undefined',
        instanceReady: window.apperSDK?.isInitialized === true
      };
      
      // Log status for debugging
      console.log('SDK Status Check:', status);
      
      return status;
    } catch (error) {
      console.error('Error checking SDK status:', error);
      return {
        available: false,
        initialized: false,
        ready: false,
        sdkInstance: false,
        instanceReady: false,
        error: error.message
      };
    }
  }

  useEffect(() => {
    let interval;
    let timeout;
    
    // Check SDK status periodically with improved error handling
    const checkStatus = () => {
      try {
        const status = checkSDKStatus();
        setSdkReady(status.ready);
        
        if (status.ready) {
          setSdkError(null);
          if (interval) clearInterval(interval);
          if (timeout) clearTimeout(timeout);
        } else if (status.available && !status.initialized) {
          // SDK loaded but not initialized properly
          setSdkError(new Error('Apper SDK loaded but initialization failed'));
        }
      } catch (error) {
        console.error('Error checking SDK status:', error);
        setSdkError(error);
      }
    };

    // Initial check
    checkStatus();
    
    // Set up periodic checking with exponential backoff
    let checkCount = 0;
    const startChecking = () => {
      interval = setInterval(() => {
        checkStatus();
        checkCount++;
        
        // Reduce frequency after initial attempts
        if (checkCount > 10) {
          clearInterval(interval);
          interval = setInterval(checkStatus, 5000); // Check every 5 seconds
        }
      }, 1000);
    };
    
    startChecking();
    
    // Set timeout for SDK loading with better error handling
    timeout = setTimeout(() => {
      if (!sdkReady) {
        const status = checkSDKStatus();
        const errorMsg = status.available 
          ? 'Apper SDK loaded but failed to initialize within timeout'
          : 'Apper SDK failed to load within timeout';
        setSdkError(new Error(errorMsg));
      }
    }, 30000);
    
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [sdkReady]);

  // Handle canvas-specific errors with better error categorization
  const handleCanvasError = (event) => {
    console.error('Canvas error:', event);
    
    // Categorize error for better handling
    const errorMsg = event.error?.message || event.message || 'Unknown canvas error';
    if (errorMsg.includes('Apper') || errorMsg.includes('SDK')) {
      setSdkError(new Error(`SDK Canvas Error: ${errorMsg}`));
    } else {
      setSdkError(new Error(`Canvas rendering error: ${errorMsg}`));
    }
  };
  
  useEffect(() => {
    window.addEventListener('error', handleCanvasError);
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Apper')) {
        console.error('Unhandled promise rejection in SDK:', event.reason);
        setSdkError(new Error(`SDK Promise Error: ${event.reason.message}`));
      }
    });
    
    return () => {
      window.removeEventListener('error', handleCanvasError);
      window.removeEventListener('unhandledrejection', handleCanvasError);
    };
  }, []);
  
  // Create SDK utilities object with enhanced functionality
  const sdkUtils = {
    ready: sdkReady,
    error: sdkError,
checkStatus: checkSDKStatus,
    reinitialize: async () => {
      try {
        if (typeof window.apperSDK !== 'undefined' && window.apperSDK) {
          window.apperSDK.isInitialized = false;
          await window.apperSDK.initialize();
          setSdkReady(true);
          setSdkError(null);
        } else {
          // Create new SDK instance if not available
          const ApperSDK = window.ApperSDK;
          if (ApperSDK) {
            window.apperSDK = new ApperSDK();
            await window.apperSDK.initialize();
            setSdkReady(true);
            setSdkError(null);
          } else {
            throw new Error('SDK class not available for reinitialization');
          }
        }
      } catch (error) {
        console.error('Failed to reinitialize SDK:', error);
        setSdkError(error);
      }
    }
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