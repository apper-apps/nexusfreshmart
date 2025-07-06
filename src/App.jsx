import 'react-toastify/dist/ReactToastify.css'
import React, { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { persistor, store } from "@/store/index";
import Layout from "@/components/organisms/Layout";
import Error from "@/components/ui/Error";
import Loading from "@/components/ui/Loading";
import ProductDetail from "@/components/pages/ProductDetail";
import Cart from "@/components/pages/Cart";
import Checkout from "@/components/pages/Checkout";
import Home from "@/components/pages/Home";
// Direct imports for core components

// Lazy load heavy components for better performance
const AdminDashboard = React.lazy(() => import('@/components/pages/AdminDashboard'));
const ProductManagement = React.lazy(() => import('@/components/pages/ProductManagement'));
const Analytics = React.lazy(() => import('@/components/pages/Analytics'));
const FinancialDashboard = React.lazy(() => import('@/components/pages/FinancialDashboard'));
const POS = React.lazy(() => import('@/components/pages/POS'));
const PaymentManagement = React.lazy(() => import('@/components/pages/PaymentManagement'));
const PayrollManagement = React.lazy(() => import('@/components/pages/PayrollManagement'));
const DeliveryTracking = React.lazy(() => import('@/components/pages/DeliveryTracking'));
const AIGenerate = React.lazy(() => import('@/components/pages/AIGenerate'));
const Category = React.lazy(() => import('@/components/pages/Category'));
const Orders = React.lazy(() => import('@/components/pages/Orders'));
const OrderTracking = React.lazy(() => import('@/components/pages/OrderTracking'));
const Account = React.lazy(() => import('@/components/pages/Account'));
// Import components

// RBAC Context for role-based access control
const RBACContext = createContext({
  user: { role: 'customer', permissions: [] },
  setUserRole: () => {},
  hasPermission: () => false,
  canAccessFinancialData: () => false
});

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within RBACProvider');
  }
  return context;
};

function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState(null);
  const [user, setUser] = useState({
    role: 'customer', // Default role: customer, admin, finance_manager
    permissions: ['read_basic'],
    id: 1,
    name: 'John Doe',
    email: 'john@example.com'
  });
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

  // Component preloader for performance
  useEffect(() => {
    // Preload likely-to-be-visited components after initial render
    const preloadTimer = setTimeout(() => {
      import("@/components/pages/Category").catch(() => {});
      import("@/components/pages/Orders").catch(() => {});
      import("@/components/pages/Account").catch(() => {});
    }, 2000);

    return () => clearTimeout(preloadTimer);
  }, []);
// RBAC utility functions
  const setUserRole = useCallback((newRole) => {
    const rolePermissions = {
      customer: ['read_basic'],
      admin: ['read_basic', 'read_financial', 'write_financial', 'manage_users'],
      finance_manager: ['read_basic', 'read_financial', 'write_financial'],
      employee: ['read_basic', 'read_limited']
    };

    setUser(prev => ({
      ...prev,
      role: newRole,
      permissions: rolePermissions[newRole] || ['read_basic']
    }));
  }, []);

  const hasPermission = useCallback((permission) => {
    return user.permissions.includes(permission);
  }, [user.permissions]);

  const canAccessFinancialData = useCallback(() => {
    return user.role === 'admin' || user.role === 'finance_manager';
  }, [user.role]);

  // Memoized RBAC context value
  const rbacValue = useMemo(() => ({
    user,
    setUserRole,
    hasPermission,
    canAccessFinancialData
  }), [user, setUserRole, hasPermission, canAccessFinancialData]);

return (
    <Provider store={store}>
      <PersistGate loading={<Loading type="page" />} persistor={persistor}>
        <RBACContext.Provider value={rbacValue}>
          <BrowserRouter>
<div className="min-h-screen bg-background">
              <div data-testid="app-loaded" style={{ display: 'none' }}>App Loaded</div>
              {/* Role Switcher (Development Only) */}
              {import.meta.env.DEV && (
<select 
                    data-testid="role-selector"
                    value={user.role} 
                    onChange={(e) => setUserRole(e.target.value)}
                    className="px-2 py-1 rounded bg-gray-800 text-white text-xs"
                  >
                    <option value="customer">Customer</option>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="employee">Employee</option>
                  </select>
                </div>
              )}
              
              {/* Minimal SDK Status Indicator (only in development) */}
              {import.meta.env.DEV && sdkError && (
<div className="px-2 py-1 rounded bg-orange-500 text-white">
                    SDK: Background Loading
                  </div>
                </div>
              )}
              
              <Suspense fallback={<Loading type="page" />}>
<Suspense fallback={<Loading type="page" />}>
              <Routes>
                <Route path="/" element={<Layout />}>
                  {/* Core routes - no lazy loading */}
                  <Route index element={<Home />} />
                  <Route path="product/:productId" element={<ProductDetail />} />
                  <Route path="cart" element={<Cart />} />
                  <Route path="checkout" element={<Checkout />} />
                  
                  {/* Lazy loaded routes */}
                  <Route path="category/:categoryName" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <Category />
                    </Suspense>
                  } />
                  <Route path="orders" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <Orders />
                    </Suspense>
                  } />
                  <Route path="orders/:orderId" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <OrderTracking />
                    </Suspense>
                  } />
                  <Route path="account" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <Account />
                    </Suspense>
                  } />
                  
                  {/* Heavy admin routes - lazy loaded */}
                  <Route path="admin" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <AdminDashboard />
                    </Suspense>
                  } />
                  <Route path="admin/products" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <ProductManagement />
                    </Suspense>
                  } />
                  <Route path="admin/pos" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <POS />
                    </Suspense>
                  } />
                  <Route path="admin/delivery-dashboard" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <DeliveryTracking />
                    </Suspense>
                  } />
                  <Route path="admin/analytics" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <Analytics />
                    </Suspense>
                  } />
                  <Route path="admin/financial-dashboard" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <FinancialDashboard />
                    </Suspense>
                  } />
                  <Route path="admin/payments" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <PaymentManagement />
                    </Suspense>
                  } />
<Route path="admin/ai-generate" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <AIGenerate />
                    </Suspense>
                  } />
                  <Route path="admin/payroll" element={
                    <Suspense fallback={<Loading type="page" />}>
                      <PayrollManagement />
                    </Suspense>
                  } />
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
        </RBACContext.Provider>
      </PersistGate>
    </Provider>
  );
}

export default App;