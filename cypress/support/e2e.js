import "./commands";
import "@testing-library/cypress/add-commands";
import React from "react";
// Import commands.js using ES2015 syntax:
// Alternatively you can use CommonJS syntax:
// require('./commands')

// Import Cypress commands

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on application errors
  // that we don't want to cause test failures
  if (err.message.includes('Apper') || err.message.includes('SDK')) {
    return false;
  }
  return true;
});

// Global before hook
beforeEach(() => {
  // Visit the application
  cy.visit('/');
  
  // Wait for the application to load
  cy.get('[data-testid="app-loaded"]', { timeout: 10000 }).should('exist');
});