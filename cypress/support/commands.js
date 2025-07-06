/* eslint-env cypress/globals */
/* global Cypress, cy */

// Custom Cypress commands for RBAC testing

// Command to switch user role in development mode
Cypress.Commands.add('switchUserRole', (role) => {
  cy.get('[data-testid="role-selector"]', { timeout: 5000 }).should('be.visible');
  cy.get('[data-testid="role-selector"]').select(role);
  cy.wait(500); // Wait for role change to take effect
});

// Command to verify financial data is hidden
Cypress.Commands.add('verifyFinancialDataHidden', () => {
  // Check that financial metrics are not visible or show placeholder values
  cy.get('[data-testid="total-revenue"]').should('not.exist');
  cy.get('[data-testid="total-profit"]').should('not.exist');
  cy.get('[data-testid="profit-margin"]').should('not.exist');
  cy.get('[data-testid="roi"]').should('not.exist');
  
  // Check for restricted access messages
  cy.get('body').should('contain.text', 'Insufficient permissions')
    .or('contain.text', 'Access denied')
    .or('contain.text', 'Financial data access requires');
});

// Command to verify financial data is visible
Cypress.Commands.add('verifyFinancialDataVisible', () => {
  // Check that financial metrics are visible with actual values
  cy.get('[data-testid="total-revenue"]').should('be.visible');
  cy.get('[data-testid="total-profit"]').should('be.visible');
  cy.get('[data-testid="profit-margin"]').should('be.visible');
  cy.get('[data-testid="roi"]').should('be.visible');
  
  // Verify values are not null or placeholder
  cy.get('[data-testid="total-revenue"]').should('not.contain.text', 'Rs. 0');
  cy.get('[data-testid="total-profit"]').should('not.contain.text', 'Rs. 0');
});

// Command to navigate to financial dashboard
Cypress.Commands.add('goToFinancialDashboard', () => {
  cy.visit('/admin/financial-dashboard');
  cy.url().should('include', '/admin/financial-dashboard');
});

// Command to navigate to admin dashboard
Cypress.Commands.add('goToAdminDashboard', () => {
  cy.visit('/admin');
  cy.url().should('include', '/admin');
});

// Command to navigate to payroll management
Cypress.Commands.add('goToPayrollManagement', () => {
  cy.visit('/admin/payroll');
  cy.url().should('include', '/admin/payroll');
});

// Command to verify navigation restrictions
Cypress.Commands.add('verifyRestrictedNavigation', (path) => {
  cy.visit(path, { failOnStatusCode: false });
  
  // Should either redirect or show access denied
  cy.url().should('not.include', path)
    .or(() => {
      cy.get('body').should('contain.text', 'Access denied')
        .or('contain.text', 'Insufficient permissions')
        .or('contain.text', 'Unauthorized');
    });
});

// Command to wait for data loading
Cypress.Commands.add('waitForDataLoad', () => {
  cy.get('[data-testid="loading"]', { timeout: 1000 }).should('not.exist');
  cy.get('[data-testid="error"]', { timeout: 1000 }).should('not.exist');
});

// Command to verify user role display
Cypress.Commands.add('verifyCurrentRole', (expectedRole) => {
  cy.get('[data-testid="role-selector"]').should('have.value', expectedRole);
});

// Command to simulate API response delays
Cypress.Commands.add('interceptFinancialAPI', (role) => {
  const restrictedResponse = {
    summary: {
      totalRevenue: null,
      totalCost: null,
      totalProfit: null,
      profitMargin: null,
      roi: null
    }
  };
  
  const fullResponse = {
    summary: {
      totalRevenue: 150000,
      totalCost: 90000,
      totalProfit: 60000,
      profitMargin: 40.0,
      roi: 66.7
    }
  };
  
  const response = role === 'customer' || role === 'employee' ? restrictedResponse : fullResponse;
  
  cy.intercept('GET', '**/financial-metrics**', response);
  cy.intercept('GET', '**/expenses**', role === 'customer' ? { statusCode: 403 } : { fixture: 'expenses.json' });
  cy.intercept('GET', '**/vendors**', role === 'customer' ? { statusCode: 403 } : { fixture: 'vendors.json' });
});