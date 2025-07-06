/* eslint-env mocha, cypress/globals */
describe('Financial RBAC - Role-Based Access Control', () => {
  beforeEach(() => {
    // Ensure we start with a clean state
    cy.visit('/');
    cy.waitForDataLoad();
  });

  describe('Customer Role Access', () => {
    beforeEach(() => {
      cy.switchUserRole('customer');
      cy.verifyCurrentRole('customer');
    });

    it('should restrict access to financial dashboard', () => {
      cy.verifyRestrictedNavigation('/admin/financial-dashboard');
    });

    it('should restrict access to admin dashboard', () => {
      cy.verifyRestrictedNavigation('/admin');
    });

    it('should restrict access to payroll management', () => {
      cy.verifyRestrictedNavigation('/admin/payroll');
    });

    it('should not display financial metrics on accessible pages', () => {
      cy.visit('/');
      cy.waitForDataLoad();
      
      // Check that financial data is not exposed on home page
      cy.get('body').should('not.contain.text', 'Total Revenue');
      cy.get('body').should('not.contain.text', 'Net Profit');
      cy.get('body').should('not.contain.text', 'Profit Margin');
      cy.get('body').should('not.contain.text', 'ROI');
    });

    it('should show appropriate error messages for restricted endpoints', () => {
      cy.interceptFinancialAPI('customer');
      cy.visit('/admin/financial-dashboard', { failOnStatusCode: false });
      
      cy.get('body').should('contain.text', 'Insufficient permissions')
        .or('contain.text', 'Access denied')
        .or('contain.text', 'Financial data access requires admin');
    });
  });

  describe('Employee Role Access', () => {
    beforeEach(() => {
      cy.switchUserRole('employee');
      cy.verifyCurrentRole('employee');
    });

    it('should restrict access to financial dashboard', () => {
      cy.verifyRestrictedNavigation('/admin/financial-dashboard');
    });

    it('should restrict access to payroll management', () => {
      cy.verifyRestrictedNavigation('/admin/payroll');
    });

    it('should have limited admin dashboard access', () => {
      cy.visit('/admin', { failOnStatusCode: false });
      
      // Employee might have some admin access but not financial data
      cy.get('body').then(($body) => {
        if ($body.text().includes('Admin Dashboard')) {
          // If employee can access admin dashboard, verify financial data is hidden
          cy.verifyFinancialDataHidden();
        } else {
          // If no access, should show restriction message
          cy.get('body').should('contain.text', 'Access denied')
            .or('contain.text', 'Insufficient permissions');
        }
      });
    });

    it('should not see financial metrics in any accessible areas', () => {
      cy.interceptFinancialAPI('employee');
      
      // Try to access any admin areas employee might have access to
      cy.visit('/admin', { failOnStatusCode: false });
      cy.waitForDataLoad();
      
      // Verify no financial data is displayed
      cy.get('[data-testid="wallet-balance"]').should('not.exist');
      cy.get('[data-testid="monthly-revenue"]').should('not.exist');
      cy.get('[data-testid="today-revenue"]').should('not.exist');
    });
  });

  describe('Finance Manager Role Access', () => {
    beforeEach(() => {
      cy.switchUserRole('finance_manager');
      cy.verifyCurrentRole('finance_manager');
    });

    it('should have full access to financial dashboard', () => {
      cy.interceptFinancialAPI('finance_manager');
      cy.goToFinancialDashboard();
      cy.waitForDataLoad();
      
      cy.verifyFinancialDataVisible();
      
      // Verify specific financial sections are accessible
      cy.get('body').should('contain.text', 'Financial Overview');
      cy.get('body').should('contain.text', 'Cash Flow Analysis');
      cy.get('body').should('contain.text', 'Expense Tracking');
      cy.get('body').should('contain.text', 'Vendor Payments');
    });

    it('should have access to payroll management', () => {
      cy.goToPayrollManagement();
      cy.waitForDataLoad();
      
      cy.get('body').should('contain.text', 'Payroll Management');
      cy.get('body').should('contain.text', 'Employee Management');
      cy.get('body').should('contain.text', 'Payroll Calculation');
    });

    it('should see financial metrics in admin dashboard', () => {
      cy.interceptFinancialAPI('finance_manager');
      cy.goToAdminDashboard();
      cy.waitForDataLoad();
      
      // Verify financial widgets are visible
      cy.get('[data-testid="wallet-balance"]').should('be.visible');
      cy.get('[data-testid="monthly-revenue"]').should('be.visible');
      cy.get('[data-testid="today-revenue"]').should('be.visible');
      
      // Verify actual data is displayed (not zeros or nulls)
      cy.get('[data-testid="wallet-balance"]').should('not.contain.text', 'Rs. 0');
      cy.get('[data-testid="monthly-revenue"]').should('not.contain.text', 'Rs. 0');
    });

    it('should be able to perform financial operations', () => {
      cy.goToFinancialDashboard();
      cy.waitForDataLoad();
      
      // Test expense management access
      cy.get('button').contains('Add Expense').should('be.visible');
      cy.get('button').contains('Add Vendor').should('be.visible');
      
      // Test export functionality
      cy.get('button').contains('Export Report').should('be.visible');
    });
  });

  describe('Admin Role Access', () => {
    beforeEach(() => {
      cy.switchUserRole('admin');
      cy.verifyCurrentRole('admin');
    });

    it('should have complete access to all financial features', () => {
      cy.interceptFinancialAPI('admin');
      cy.goToFinancialDashboard();
      cy.waitForDataLoad();
      
      cy.verifyFinancialDataVisible();
      
      // Verify all tabs are accessible
      cy.get('button').contains('Financial Overview').click();
      cy.get('button').contains('Cash Flow Analysis').click();
      cy.get('button').contains('Expense Tracking').click();
      cy.get('button').contains('Vendor Payments').click();
      
      // Each tab should load without errors
      cy.get('[data-testid="error"]').should('not.exist');
    });

    it('should have full admin dashboard access with all metrics', () => {
      cy.interceptFinancialAPI('admin');
      cy.goToAdminDashboard();
      cy.waitForDataLoad();
      
      // Verify all financial metrics are visible
      cy.get('[data-testid="wallet-balance"]').should('be.visible');
      cy.get('[data-testid="total-transactions"]').should('be.visible');
      cy.get('[data-testid="monthly-revenue"]').should('be.visible');
      cy.get('[data-testid="pending-verifications"]').should('be.visible');
      cy.get('[data-testid="today-revenue"]').should('be.visible');
      
      // Verify wallet management section
      cy.get('button').contains('Deposit Rs. 5,000').should('be.visible');
      cy.get('button').contains('Withdraw Rs. 1,000').should('be.visible');
      cy.get('button').contains('Transfer Rs. 2,000').should('be.visible');
    });

    it('should have full payroll management access', () => {
      cy.goToPayrollManagement();
      cy.waitForDataLoad();
      
      // Verify all payroll tabs are accessible
      cy.get('button').contains('Employee Management').should('be.visible');
      cy.get('button').contains('Attendance Tracking').should('be.visible');
      cy.get('button').contains('Payroll Calculation').should('be.visible');
      
      // Test tab switching
      cy.get('button').contains('Attendance Tracking').click();
      cy.get('body').should('contain.text', 'Attendance Tracking');
      
      cy.get('button').contains('Payroll Calculation').click();
      cy.get('body').should('contain.text', 'Payroll Calculation');
    });

    it('should be able to perform all financial operations', () => {
      cy.goToFinancialDashboard();
      cy.waitForDataLoad();
      
      // Test expense operations
      cy.get('button').contains('Add Expense').click();
      cy.get('[data-testid="expense-modal"]').should('be.visible');
      cy.get('button').contains('Cancel').click();
      
      // Test vendor operations
      cy.get('button').contains('Add Vendor').click();
      cy.get('[data-testid="vendor-modal"]').should('be.visible');
      cy.get('button').contains('Cancel').click();
      
      // Test export functionality
      cy.get('button').contains('Export Report').should('be.enabled');
    });
  });

  describe('Role Switching and Data Updates', () => {
    it('should update data visibility when switching roles', () => {
      // Start as admin
      cy.switchUserRole('admin');
      cy.interceptFinancialAPI('admin');
      cy.goToAdminDashboard();
      cy.waitForDataLoad();
      
      // Verify admin sees financial data
      cy.get('[data-testid="wallet-balance"]').should('be.visible');
      
      // Switch to customer
      cy.switchUserRole('customer');
      cy.interceptFinancialAPI('customer');
      cy.reload();
      cy.waitForDataLoad();
      
      // Verify customer doesn't see financial data
      cy.get('[data-testid="wallet-balance"]').should('not.exist');
    });

    it('should maintain role restrictions across page navigation', () => {
      cy.switchUserRole('customer');
      cy.verifyCurrentRole('customer');
      
      // Navigate through various pages and verify restrictions persist
      cy.visit('/');
      cy.verifyCurrentRole('customer');
      
      cy.visit('/orders');
      cy.verifyCurrentRole('customer');
      
      // Try to access restricted area
      cy.verifyRestrictedNavigation('/admin/financial-dashboard');
      cy.verifyCurrentRole('customer');
    });

    it('should handle rapid role switching correctly', () => {
      const roles = ['customer', 'admin', 'finance_manager', 'employee'];
      
      roles.forEach((role) => {
        cy.switchUserRole(role);
        cy.verifyCurrentRole(role);
        cy.wait(200);
      });
      
      // Final verification with restricted role
      cy.switchUserRole('customer');
      cy.verifyRestrictedNavigation('/admin/financial-dashboard');
    });
  });

  describe('API Security Verification', () => {
    it('should return filtered data for non-authorized users', () => {
      cy.switchUserRole('customer');
      
      // Intercept API calls and verify responses
      cy.intercept('GET', '**/financial-metrics**').as('getFinancialMetrics');
      
      cy.visit('/admin/financial-dashboard', { failOnStatusCode: false });
      
      cy.wait('@getFinancialMetrics').then((interception) => {
        const response = interception.response.body;
        
        // Verify sensitive fields are null or undefined
        expect(response.summary.totalRevenue).to.be.null;
        expect(response.summary.totalCost).to.be.null;
        expect(response.summary.totalProfit).to.be.null;
        expect(response.summary.profitMargin).to.be.null;
        expect(response.summary.roi).to.be.null;
      });
    });

    it('should return complete data for authorized users', () => {
      cy.switchUserRole('admin');
      
      cy.intercept('GET', '**/financial-metrics**').as('getFinancialMetrics');
      
      cy.goToFinancialDashboard();
      
      cy.wait('@getFinancialMetrics').then((interception) => {
        const response = interception.response.body;
        
        // Verify sensitive fields contain actual data
        expect(response.summary.totalRevenue).to.be.a('number');
        expect(response.summary.totalCost).to.be.a('number');
        expect(response.summary.totalProfit).to.be.a('number');
        expect(response.summary.profitMargin).to.be.a('number');
        expect(response.summary.roi).to.be.a('number');
      });
    });
  });
});