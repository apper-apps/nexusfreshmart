/* eslint-env jest */
/* global jest, describe, test, beforeEach, expect */

import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { mockToast, renderWithProviders } from "../utils/testUtils";
import Error from "@/components/ui/Error";
import FinancialDashboard from "@/components/pages/FinancialDashboard";
import { financialService } from "@/services/api/financialService";
import { orderService } from "@/services/api/orderService";
import { productService } from "@/services/api/productService";

// Mock the financial service
jest.mock('@/services/api/financialService', () => ({
  financialService: {
    setUserRole: jest.fn(),
    getFinancialMetrics: jest.fn(),
    getExpenses: jest.fn(),
    getVendors: jest.fn(),
    getCashFlowAnalytics: jest.fn(),
    calculateWorkingCapital: jest.fn(),
    getLiquidityMetrics: jest.fn(),
    getCashFlowProjections: jest.fn()
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

// Mock react-apexcharts
jest.mock('react-apexcharts', () => {
  return function MockChart() {
    return <div data-testid="mock-chart">Chart</div>;
  };
});

// Mock order and product services
jest.mock('@/services/api/orderService', () => ({
  orderService: {
    getAll: jest.fn().mockResolvedValue([])
  }
}));

jest.mock('@/services/api/productService', () => ({
  productService: {
    getAll: jest.fn().mockResolvedValue([])
  }
}));

describe('FinancialDashboard RBAC Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin Role Access', () => {
    test('should display full financial metrics for admin', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: {
          totalRevenue: 150000,
          totalCost: 90000,
          totalProfit: 60000,
          profitMargin: 40.0,
          roi: 66.7
        },
        productMetrics: [],
        categoryMetrics: []
      });

      financialService.getExpenses.mockResolvedValue([]);
      financialService.getVendors.mockResolvedValue([]);
      financialService.getCashFlowAnalytics.mockResolvedValue({
        totalInflows: 150000,
        totalOutflows: 90000,
        netCashFlow: 60000,
        trendData: []
      });

      renderWithProviders(<FinancialDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify financial metrics are displayed
      expect(screen.getByText('Rs. 150,000')).toBeInTheDocument();
      expect(screen.getByText('Rs. 60,000')).toBeInTheDocument();
      expect(screen.getByText('40.0%')).toBeInTheDocument();
      expect(screen.getByText('66.7%')).toBeInTheDocument();
    });

    test('should allow access to all financial tabs for admin', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      // Mock all required methods
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: 150000, totalCost: 90000, totalProfit: 60000, profitMargin: 40.0, roi: 66.7 },
        productMetrics: [], categoryMetrics: []
      });
      financialService.getExpenses.mockResolvedValue([]);
      financialService.getVendors.mockResolvedValue([]);
      financialService.getCashFlowAnalytics.mockResolvedValue({
        totalInflows: 150000, totalOutflows: 90000, netCashFlow: 60000, trendData: []
      });
      financialService.calculateWorkingCapital.mockResolvedValue({
        amount: 50000, ratio: 1.5, currentAssets: 100000, currentLiabilities: 50000
      });
      financialService.getLiquidityMetrics.mockResolvedValue({
        currentRatio: 1.5, quickRatio: 1.2, cashRatio: 0.8, operatingCashFlowRatio: 1.0
      });
      financialService.getCashFlowProjections.mockResolvedValue([]);

      renderWithProviders(<FinancialDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      // Test tab navigation
      const cashFlowTab = screen.getByText('Cash Flow Analysis');
      fireEvent.click(cashFlowTab);

      await waitFor(() => {
        expect(screen.getByText('Cash Flow Trend Analysis')).toBeInTheDocument();
      });

      const expenseTab = screen.getByText('Expense Tracking');
      fireEvent.click(expenseTab);

      await waitFor(() => {
        expect(screen.getByText('Add Expense')).toBeInTheDocument();
      });

      const vendorTab = screen.getByText('Vendor Payments');
      fireEvent.click(vendorTab);

      await waitFor(() => {
        expect(screen.getByText('Add Vendor')).toBeInTheDocument();
      });
    });

    test('should allow financial operations for admin', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: 150000, totalCost: 90000, totalProfit: 60000, profitMargin: 40.0, roi: 66.7 },
        productMetrics: [], categoryMetrics: []
      });

      renderWithProviders(<FinancialDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      // Test export functionality
      const exportButton = screen.getByText('Export Report');
      expect(exportButton).toBeEnabled();

      fireEvent.click(exportButton);
      // Verify export was attempted (would download file in real scenario)
    });
  });

  describe('Finance Manager Role Access', () => {
    test('should display full financial metrics for finance manager', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: {
          totalRevenue: 150000,
          totalCost: 90000,
          totalProfit: 60000,
          profitMargin: 40.0,
          roi: 66.7
        },
        productMetrics: [],
        categoryMetrics: []
      });

      financialService.getExpenses.mockResolvedValue([]);
      financialService.getVendors.mockResolvedValue([]);

      renderWithProviders(<FinancialDashboard />, { userRole: 'finance_manager' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify financial metrics are displayed
      expect(screen.getByText('Rs. 150,000')).toBeInTheDocument();
      expect(screen.getByText('Rs. 60,000')).toBeInTheDocument();
    });

    test('should allow expense management for finance manager', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: 150000, totalCost: 90000, totalProfit: 60000, profitMargin: 40.0, roi: 66.7 },
        productMetrics: [], categoryMetrics: []
      });
      financialService.getExpenses.mockResolvedValue([]);

      renderWithProviders(<FinancialDashboard />, { userRole: 'finance_manager' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      // Navigate to expense tracking
      const expenseTab = screen.getByText('Expense Tracking');
      fireEvent.click(expenseTab);

      await waitFor(() => {
        expect(screen.getByText('Add Expense')).toBeInTheDocument();
      });

      // Test expense form opening
      const addExpenseButton = screen.getByText('Add Expense');
      fireEvent.click(addExpenseButton);

      // Should be able to access expense form
      await waitFor(() => {
        expect(screen.getByText('Add New Expense')).toBeInTheDocument();
      });
    });
  });

  describe('Customer Role Restrictions', () => {
    test('should show access denied for customer', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockRejectedValue(
        new Error('Insufficient permissions. Financial data access requires admin or finance manager role.')
      );

      renderWithProviders(<FinancialDashboard />, { userRole: 'customer' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load financial data/)).toBeInTheDocument();
      });
    });

    test('should not display financial metrics for customer', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: {
          totalRevenue: null,
          totalCost: null,
          totalProfit: null,
          profitMargin: null,
          roi: null
        },
        productMetrics: [],
        categoryMetrics: []
      });

      renderWithProviders(<FinancialDashboard />, { userRole: 'customer' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify sensitive data is not displayed
      expect(screen.queryByText('Rs. 150,000')).not.toBeInTheDocument();
      expect(screen.queryByText('Rs. 60,000')).not.toBeInTheDocument();
      expect(screen.queryByText('40.0%')).not.toBeInTheDocument();
    });

    test('should restrict expense access for customer', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: null, totalCost: null, totalProfit: null, profitMargin: null, roi: null },
        productMetrics: [], categoryMetrics: []
      });
      financialService.getExpenses.mockRejectedValue(new Error('Insufficient permissions'));

      renderWithProviders(<FinancialDashboard />, { userRole: 'customer' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      // Try to navigate to expense tracking
      const expenseTab = screen.getByText('Expense Tracking');
      fireEvent.click(expenseTab);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load expense data/)).toBeInTheDocument();
      });
    });
  });

  describe('Employee Role Restrictions', () => {
    test('should show restricted access for employee', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: {
          totalRevenue: null,
          totalCost: null,
          totalProfit: null,
          profitMargin: null,
          roi: null
        },
        productMetrics: [],
        categoryMetrics: []
      });

      renderWithProviders(<FinancialDashboard />, { userRole: 'employee' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify financial data is not visible
      expect(screen.queryByText('Rs. 150,000')).not.toBeInTheDocument();
      expect(screen.queryByText('Rs. 60,000')).not.toBeInTheDocument();
    });

    test('should restrict vendor access for employee', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: null, totalCost: null, totalProfit: null, profitMargin: null, roi: null },
        productMetrics: [], categoryMetrics: []
      });
      financialService.getVendors.mockResolvedValue([]); // Filtered data

      renderWithProviders(<FinancialDashboard />, { userRole: 'employee' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      // Navigate to vendor payments
      const vendorTab = screen.getByText('Vendor Payments');
      fireEvent.click(vendorTab);

      await waitFor(() => {
        // Employee might see basic vendor info but not financial operations
        expect(screen.queryByText('Add Vendor')).not.toBeInTheDocument();
        expect(screen.queryByText('Record Payment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle API errors gracefully', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<FinancialDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load financial data/)).toBeInTheDocument();
      });

      // Should show retry option
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
    });

    test('should handle empty data gracefully', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: 0, totalCost: 0, totalProfit: 0, profitMargin: 0, roi: 0 },
        productMetrics: [], categoryMetrics: []
      });

      renderWithProviders(<FinancialDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Financial Dashboard')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should display zero values appropriately
      expect(screen.getByText('Rs. 0')).toBeInTheDocument();
      expect(screen.getByText('0.0%')).toBeInTheDocument();
    });

    test('should handle role switching during component lifecycle', async () => {
      const { financialService } = require('@/services/api/financialService');
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: 150000, totalCost: 90000, totalProfit: 60000, profitMargin: 40.0, roi: 66.7 },
        productMetrics: [], categoryMetrics: []
      });

      const { rbacValue, rerender } = renderWithProviders(<FinancialDashboard />, { userRole: 'admin' });

      await waitFor(() => {
        expect(screen.getByText('Rs. 150,000')).toBeInTheDocument();
      });

      // Simulate role change
      rbacValue.user.role = 'customer';
      rbacValue.canAccessFinancialData = jest.fn(() => false);
      
      financialService.getFinancialMetrics.mockResolvedValue({
        summary: { totalRevenue: null, totalCost: null, totalProfit: null, profitMargin: null, roi: null },
        productMetrics: [], categoryMetrics: []
      });

      rerender(<FinancialDashboard />);

      // Should update to reflect new role restrictions
      await waitFor(() => {
        expect(screen.queryByText('Rs. 150,000')).not.toBeInTheDocument();
      });
    });
  });
});