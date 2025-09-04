// Custom Cypress commands

Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('[data-testid="auth-button"]').click();
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.contains('Sign In').click();
  cy.get('[data-testid="user-menu"]').should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click();
  cy.contains('Logout').click();
  cy.get('[data-testid="auth-button"]').should('be.visible');
});

Cypress.Commands.add('navigateTo', (page) => {
  cy.get(`[data-testid="sidebar-${page}"]`).click();
  cy.url().should('include', `/${page}`);
});

Cypress.Commands.add('waitForDataLoad', () => {
  cy.get('[data-testid="loading"]', { timeout: 10000 }).should('not.exist');
});

Cypress.Commands.add('mockApiResponse', (endpoint, response) => {
  cy.intercept('GET', endpoint, response).as('apiCall');
});

Cypress.Commands.add('checkAlertNotification', () => {
  cy.get('[data-testid="alert-icon"]').should('be.visible');
  cy.get('[data-testid="alert-count"]').should('be.visible');
});
