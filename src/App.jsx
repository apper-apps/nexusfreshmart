import 'react-toastify/dist/ReactToastify.css';
import React, { useEffect, useState, Suspense, useMemo, useCallback } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Layout from "@/components/organisms/Layout";
import Loading from "@/components/ui/Loading";

// Critical pages - loaded immediately for core user flow
import Home from "@/components/pages/Home";
import ProductDetail from "@/components/pages/ProductDetail";
import Cart from "@/components/pages/Cart";
import Checkout from "@/components/pages/Checkout";

// Heavy admin pages - lazy loaded with highest priority for code splitting
const AdminDashboard = React.lazy(() => 
  import("@/components/pages/AdminDashboard").then(module => ({ default: module.default }))
);
const ProductManagement = React.lazy(() => 
  import("@/components/pages/ProductManagement").then(module => ({ default: module.default }))
);
const Analytics = React.lazy(() => 
  import("@/components/pages/Analytics").then(module => ({ default: module.default }))
);
const POS = React.lazy(() => 
  import("@/components/pages/POS").then(module => ({ default: module.default }))
);
const PaymentManagement = React.lazy(() => 
  import("@/components/pages/PaymentManagement").then(module => ({ default: module.default }))
);
const DeliveryTracking = React.lazy(() => 
  import("@/components/pages/DeliveryTracking").then(module => ({ default: module.default }))
);

// User-facing pages - lazy loaded with medium priority
const Category = React.lazy(() => 
  import("@/components/pages/Category").then(module => ({ default: module.default }))
);
const Orders = React.lazy(() => 
  import("@/components/pages/Orders").then(module => ({ default: module.default }))
);
const OrderTracking = React.lazy(() => 
  import("@/components/pages/OrderTracking").then(module => ({ default: module.default }))
);
const Account = React.lazy(() => 
  import("@/components/pages/Account").then(module => ({ default: module.default }))
);

function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);

  // Optimized SDK status checking - memoized for performance
  const checkSDKStatus = useCallback(() => {
    try {
      const status = {
        available: typeof window.Apper !== 'undefined',
        ready: typeof window.apperSDK !== 'undefined',
        initialized: window.apperSDK?.isInitialized === true
      };
      return status;
    } catch (error) {
      console.error('Error checking SDK status:', error);
      return { available: false, ready: false, initialized: false, error: error.message };
    }
  }, []);
// Optimized SDK monitoring - non-blocking and lightweight
  useEffect(() => {
    let mounted = true;
    let checkCount = 0;
    
    const checkStatus = () => {
      if (!mounted || checkCount > 5) return; // Limit checks to prevent performance impact
      
      const status = checkSDKStatus();
      if (status.ready || status.initialized) {
        setSdkReady(true);
        setSdkError(null);
      } else if (checkCount === 5) {
        // After 5 attempts, just warn but don't block the app
        console.warn('SDK not ready after initial checks - continuing without it');
      }
      checkCount++;
    };

    // Check immediately and then periodically
    checkStatus();
    const interval = setInterval(checkStatus, 1000);
    
    // Clean timeout - don't wait forever
    const timeout = setTimeout(() => {
      if (mounted) {
        clearInterval(interval);
      }
    }, 6000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [checkSDKStatus]);

// Lightweight error handling - don't block the app for SDK errors
  useEffect(() => {
    const handleError = (event) => {
      if (event.reason?.message?.includes('Apper') || event.error?.message?.includes('Apper')) {
        console.warn('SDK error detected but not blocking app:', event);
        // Don't set SDK error state - just log it
      }
    };
    
    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);
// Memoized SDK utilities for performance
  const sdkUtils = useMemo(() => ({
    ready: sdkReady,
    error: sdkError,
    checkStatus: checkSDKStatus
  }), [sdkReady, sdkError, checkSDKStatus]);

// Intelligent component preloader for performance optimization
  useEffect(() => {
    // Preload user-facing components after core app loads
    const preloadUserPages = setTimeout(() => {
      // High probability user pages
      import("@/components/pages/Category").catch(() => {});
      import("@/components/pages/Orders").catch(() => {});
      import("@/components/pages/Account").catch(() => {});
    }, 1500);

    // Preload admin components for admin users (delayed)
    const preloadAdminPages = setTimeout(() => {
      if (window.location.pathname.includes('/admin')) {
        import("@/components/pages/AdminDashboard").catch(() => {});
        import("@/components/pages/ProductManagement").catch(() => {});
      }
    }, 3000);

    return () => {
      clearTimeout(preloadUserPages);
      clearTimeout(preloadAdminPages);
    };
  }, []);
return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        {/* Minimal SDK Status Indicator (only in development) */}
        {import.meta.env.DEV && sdkError && (
          <div className="fixed top-0 right-0 z-50 p-2 text-xs">
            <div className="px-2 py-1 rounded bg-orange-500 text-white">
              SDK: Background Loading
            </div>
          </div>
        )}
<Suspense fallback={<Loading type="page" />}>
          <Routes>
            <Route path="/" element={<Layout />}>
              {/* Core routes - no lazy loading */}
              <Route index element={<Home />} />
              <Route path="product/:productId" element={<ProductDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              
              {/* Lazy loaded routes */}
              <Route path="category/:categoryName" element={<Category />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderTracking />} />
              <Route path="account" element={<Account />} />
              
              {/* Heavy admin routes - lazy loaded */}
              <Route path="admin" element={<AdminDashboard />} />
              <Route path="admin/products" element={<ProductManagement />} />
              <Route path="admin/pos" element={<POS />} />
              <Route path="admin/delivery-dashboard" element={<DeliveryTracking />} />
              <Route path="admin/analytics" element={<Analytics />} />
              <Route path="admin/payments" element={<PaymentManagement />} />
            </Route>
          </Routes>
        </Suspense>
<ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="colored"
          style={{ zIndex: 9999 }}
          limit={3}
        />
      </div>

  


    </BrowserRouter>
  );
}

export default App;