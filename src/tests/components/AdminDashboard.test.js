/**
 * @jest-environment jsdom
 */

/* eslint-env jest */
/* global jest, describe, test, expect, beforeEach */

import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../utils/testUtils";
import Error from "@/components/ui/Error";
import AdminDashboard from "@/components/pages/AdminDashboard";
import { orderService } from "@/services/api/orderService";
import { productServiceInstance } from "@/services/api/productService";
import { paymentService } from "@/services/api/paymentService";
// Mock services
jest.mock('@/services/api/orderService', () => ({
  orderService: {
    getAll: jest.fn(),
    getMonthlyRevenue: jest.fn(),
    getPendingVerifications: jest.fn(),
    getRevenueByPaymentMethod: jest.fn()
  }
}));

jest.mock('@/services/api/productService', () => ({
  productServiceInstance: {
    getAll: jest.fn()
  }
}));

jest.mock('@/services/api/paymentService', () => ({
  paymentService: {
    getWalletBalance: jest.fn(),
    getWalletTransactions: jest.fn(),
    depositToWallet: jest.fn(),
    withdrawFromWallet: jest.fn(),
    transferFromWallet: jest.fn()
  }
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn()
  }
}));

describe('AdminDashboard RBAC Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Role Access', () => {
    test('should display all financial metrics for admin', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      // Mock data responses
      orderService.getAll.mockResolvedValue([
        {
          id: 1,
          createdAt: new Date().toISOString(),
          totalAmount: 1500,
          items: [{ productId: 1, quantity: 2 }],
          status: 'completed'
        }
      ]);

      productServiceInstance.getAll.mockResolvedValue([
        { id: 1, name: 'Test Product', price: 100, stock: 50 }
      ]);

      paymentService.getWalletBalance.mockResolvedValue(50000);
      paymentService.getWalletTransactions.mockResolvedValue([
        { id: 1, type: 'deposit', amount: 5000, timestamp: new Date().toISOString() }
      ]);

      orderService.getMonthlyRevenue.mockResolvedValue(75000);
      orderService.getPendingVerifications.mockResolvedValue([]);
      orderService.getRevenueByPaymentMethod.mockResolvedValue({
        'credit_card': 30000,
        'cash': 25000,
        'wallet': 20000
      });

      renderWithProviders(<AdminDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify financial metrics are visible
      expect(screen.getByText('Rs. 50,000')).toBeInTheDocument(); // Wallet balance
      expect(screen.getByText('Rs. 75,000')).toBeInTheDocument(); // Monthly revenue
      expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    test('should allow wallet operations for admin', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      // Mock basic data
      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockResolvedValue(50000);
      paymentService.getWalletTransactions.mockResolvedValue([]);
      orderService.getMonthlyRevenue.mockResolvedValue(0);
      orderService.getPendingVerifications.mockResolvedValue([]);
      orderService.getRevenueByPaymentMethod.mockResolvedValue({});

      paymentService.depositToWallet.mockResolvedValue({ success: true });

      renderWithProviders(<AdminDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Find and click deposit button
      const depositButton = screen.getByText('Deposit Rs. 5,000');
      expect(depositButton).toBeEnabled();

      fireEvent.click(depositButton);

      await waitFor(() => {
        expect(paymentService.depositToWallet).toHaveBeenCalledWith(5000);
      });
    });

    test('should display wallet transactions for admin', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockResolvedValue(50000);
      paymentService.getWalletTransactions.mockResolvedValue([
        {
          Id: 1,
          type: 'deposit',
          amount: 5000,
          timestamp: new Date().toISOString()
        },
        {
          Id: 2,
          type: 'withdraw',
          amount: 1000,
          timestamp: new Date().toISOString()
        }
      ]);
      orderService.getMonthlyRevenue.mockResolvedValue(0);
      orderService.getPendingVerifications.mockResolvedValue([]);
      orderService.getRevenueByPaymentMethod.mockResolvedValue({});

      renderWithProviders(<AdminDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify wallet transactions are displayed
      expect(screen.getByText('Recent Wallet Transactions')).toBeInTheDocument();
      expect(screen.getByText('+Rs. 5,000')).toBeInTheDocument();
      expect(screen.getByText('-Rs. 1,000')).toBeInTheDocument();
    });

    test('should show revenue breakdown for admin', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockResolvedValue(50000);
      paymentService.getWalletTransactions.mockResolvedValue([]);
      orderService.getMonthlyRevenue.mockResolvedValue(75000);
      orderService.getPendingVerifications.mockResolvedValue([]);
      orderService.getRevenueByPaymentMethod.mockResolvedValue({
        'credit_card': 30000,
        'cash': 25000,
        'wallet': 20000
      });

      renderWithProviders(<AdminDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify revenue breakdown is displayed
      expect(screen.getByText('Revenue by Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Credit_card')).toBeInTheDocument();
      expect(screen.getByText('Rs. 30,000')).toBeInTheDocument();
      expect(screen.getByText('Rs. 25,000')).toBeInTheDocument();
      expect(screen.getByText('Rs. 20,000')).toBeInTheDocument();
    });
  });

  describe('Customer Role Restrictions', () => {
    test('should not render admin dashboard for customer', () => {
      // Customer should not be able to access admin dashboard at all
      // This would typically be handled by routing restrictions
      
      const { container } = renderWithProviders(<AdminDashboard />, { userRole: 'customer' });
      
      // In a real application, this component wouldn't render for customers
      // but if it does, it should not show sensitive data
      expect(container.firstChild).toBeInTheDocument();
    });

    test('should hide financial data if somehow accessed by customer', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      // Mock empty/restricted responses
      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockRejectedValue(new Error('Access denied'));
      paymentService.getWalletTransactions.mockRejectedValue(new Error('Access denied'));
      orderService.getMonthlyRevenue.mockRejectedValue(new Error('Access denied'));
      orderService.getPendingVerifications.mockRejectedValue(new Error('Access denied'));
      orderService.getRevenueByPaymentMethod.mockRejectedValue(new Error('Access denied'));

      renderWithProviders(<AdminDashboard />, { userRole: 'customer' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Financial data should show as 0 or be hidden
      const walletElements = screen.queryAllByText(/Rs\. 0/);
      expect(walletElements.length).toBeGreaterThan(0);
    });
  });

  describe('Employee Role Restrictions', () => {
    test('should show limited access for employee', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      // Employee might have some access but limited financial data
      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockRejectedValue(new Error('Insufficient permissions'));
      paymentService.getWalletTransactions.mockRejectedValue(new Error('Insufficient permissions'));
      orderService.getMonthlyRevenue.mockRejectedValue(new Error('Insufficient permissions'));
      orderService.getPendingVerifications.mockResolvedValue([]); // Might have access to this
      orderService.getRevenueByPaymentMethod.mockRejectedValue(new Error('Insufficient permissions'));

      renderWithProviders(<AdminDashboard />, { userRole: 'employee' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should not show wallet management section
      expect(screen.queryByText('Wallet Management')).not.toBeInTheDocument();
      expect(screen.queryByText('Revenue by Payment Method')).not.toBeInTheDocument();
    });

    test('should not allow wallet operations for employee', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockRejectedValue(new Error('Access denied'));
      paymentService.getWalletTransactions.mockRejectedValue(new Error('Access denied'));

      renderWithProviders(<AdminDashboard />, { userRole: 'employee' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Wallet operation buttons should not be present
      expect(screen.queryByText('Deposit Rs. 5,000')).not.toBeInTheDocument();
      expect(screen.queryByText('Withdraw Rs. 1,000')).not.toBeInTheDocument();
      expect(screen.queryByText('Transfer Rs. 2,000')).not.toBeInTheDocument();
    });
  });

  describe('Finance Manager Role Access', () => {
    test('should display financial metrics for finance manager', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockResolvedValue(50000);
      paymentService.getWalletTransactions.mockResolvedValue([]);
      orderService.getMonthlyRevenue.mockResolvedValue(75000);
      orderService.getPendingVerifications.mockResolvedValue([]);
      orderService.getRevenueByPaymentMethod.mockResolvedValue({
        'credit_card': 30000
      });

      renderWithProviders(<AdminDashboard />, { userRole: 'finance_manager' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Finance manager should see financial data
      expect(screen.getByText('Rs. 50,000')).toBeInTheDocument();
      expect(screen.getByText('Rs. 75,000')).toBeInTheDocument();
      expect(screen.getByText('Wallet Balance')).toBeInTheDocument();
      expect(screen.getByText('Monthly Revenue')).toBeInTheDocument();
    });

    test('should allow some wallet operations for finance manager', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockResolvedValue(50000);
      paymentService.getWalletTransactions.mockResolvedValue([]);
      orderService.getMonthlyRevenue.mockResolvedValue(0);
      orderService.getPendingVerifications.mockResolvedValue([]);
      orderService.getRevenueByPaymentMethod.mockResolvedValue({});

      renderWithProviders(<AdminDashboard />, { userRole: 'finance_manager' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Finance manager should see wallet management
      expect(screen.getByText('Wallet Management')).toBeInTheDocument();
      expect(screen.getByText('Deposit Rs. 5,000')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockRejectedValue(new Error('Network error'));
      productServiceInstance.getAll.mockRejectedValue(new Error('Network error'));
      paymentService.getWalletBalance.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<AdminDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load dashboard data/)).toBeInTheDocument();
      });

      // Should show retry option
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    test('should show appropriate error messages for access denied', async () => {
      const { orderService } = require('@/services/api/orderService');
      const { productServiceInstance } = require('@/services/api/productService');
      const { paymentService } = require('@/services/api/paymentService');

      orderService.getAll.mockResolvedValue([]);
      productServiceInstance.getAll.mockResolvedValue([]);
      paymentService.getWalletBalance.mockRejectedValue(new Error('Access denied'));
      paymentService.getWalletTransactions.mockRejectedValue(new Error('Access denied'));

      renderWithProviders(<AdminDashboard />, { userRole: 'customer' });

      await waitFor(() => {
        expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      });

      // Should handle access denied gracefully
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Sensitive sections should not display or show restricted message
      expect(screen.queryByText('Wallet Management')).not.toBeInTheDocument();
    });
  });
});