/* global jest */
import React from "react";
import { render } from "@testing-library/react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "@/store/cartSlice";
import { store } from "@/store/index";
import Error from "@/components/ui/Error";

// Create a mock store for testing
export const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState: initialState,
  });
};

// RBAC Context for testing
export const createRBACContext = (userRole = 'customer') => {
  const rolePermissions = {
    customer: ['read_basic'],
    admin: ['read_basic', 'read_financial', 'write_financial', 'manage_users'],
    finance_manager: ['read_basic', 'read_financial', 'write_financial'],
    employee: ['read_basic', 'read_limited']
  };

  return React.createContext({
    user: {
      role: userRole,
      permissions: rolePermissions[userRole] || ['read_basic'],
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    },
    setUserRole: jest.fn(),
    hasPermission: jest.fn((permission) => rolePermissions[userRole].includes(permission)),
    canAccessFinancialData: jest.fn(() => userRole === 'admin' || userRole === 'finance_manager')
  });
};

// Custom render function with providers
export const renderWithProviders = (
  ui,
  {
    initialState = {},
    store = createMockStore(initialState),
    userRole = 'customer',
    ...renderOptions
  } = {}
) => {
  const RBACContext = createRBACContext(userRole);
  
  const rolePermissions = {
    customer: ['read_basic'],
    admin: ['read_basic', 'read_financial', 'write_financial', 'manage_users'],
    finance_manager: ['read_basic', 'read_financial', 'write_financial'],
    employee: ['read_basic', 'read_limited']
  };

  const rbacValue = {
    user: {
      role: userRole,
      permissions: rolePermissions[userRole] || ['read_basic'],
      id: 1,
      name: 'Test User',
      email: 'test@example.com'
    },
    setUserRole: jest.fn(),
    hasPermission: jest.fn((permission) => rolePermissions[userRole].includes(permission)),
    canAccessFinancialData: jest.fn(() => userRole === 'admin' || userRole === 'finance_manager')
  };

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          <RBACContext.Provider value={rbacValue}>
            <div data-testid="app-loaded">
              {children}
            </div>
          </RBACContext.Provider>
        </BrowserRouter>
      </Provider>
    );
  }

  return {
    store,
    rbacValue,
    ...render(ui, { wrapper: Wrapper, ...renderOptions })
  };
};

// Mock financial service responses
export const mockFinancialServiceResponses = {
  admin: {
    getFinancialMetrics: jest.fn().mockResolvedValue({
      summary: {
        totalRevenue: 150000,
        totalCost: 90000,
        totalProfit: 60000,
        profitMargin: 40.0,
        roi: 66.7,
        averageOrderValue: 1250,
        totalOrders: 120,
        totalItems: 450
      },
      productMetrics: [],
      categoryMetrics: []
    }),
    getExpenses: jest.fn().mockResolvedValue([]),
    getVendors: jest.fn().mockResolvedValue([])
  },
  customer: {
    getFinancialMetrics: jest.fn().mockResolvedValue({
      summary: {
        totalRevenue: null,
        totalCost: null,
        totalProfit: null,
        profitMargin: null,
        roi: null,
        averageOrderValue: 0,
        totalOrders: 120,
        totalItems: 450
      },
      productMetrics: [],
      categoryMetrics: []
    }),
    getExpenses: jest.fn().mockRejectedValue(new Error('Insufficient permissions')),
    getVendors: jest.fn().mockRejectedValue(new Error('Insufficient permissions'))
  }
};

// Helper to wait for async operations
export const waitFor = (callback, options = {}) => {
  return new Promise((resolve, reject) => {
    const timeout = options.timeout || 1000;
    const interval = options.interval || 50;
    let totalTime = 0;

    const check = () => {
      try {
        const result = callback();
        if (result) {
          resolve(result);
          return;
        }
      } catch (error) {
        // Continue checking
      }

      totalTime += interval;
      if (totalTime >= timeout) {
        reject(new Error('Timeout waiting for condition'));
        return;
      }

      setTimeout(check, interval);
    };

    check();
  });
};

// Mock toast notifications
export const mockToast = {
  success: jest.fn(),
  error: jest.fn(),
  warning: jest.fn(),
  info: jest.fn()
};

// Export all utilities
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';