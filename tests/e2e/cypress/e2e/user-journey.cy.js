describe('User Journey Tests', () => {
  beforeEach(() => {
    // Mock API responses
    cy.intercept('GET', '/api/market-data', { fixture: 'market-data.json' }).as('marketData');
    cy.intercept('GET', '/api/fear-greed', { fixture: 'fear-greed.json' }).as('fearGreed');
    cy.intercept('GET', '/api/analysis', { fixture: 'ai-analysis.json' }).as('aiAnalysis');
    cy.intercept('GET', '/api/subscription/plans', { fixture: 'subscription-plans.json' }).as('subscriptionPlans');
    
    cy.visit('/');
  });

  describe('Registration and Login Flow', () => {
    it('should complete registration with email confirmation', () => {
      // Open auth modal
      cy.get('[data-testid="auth-button"]').click();
      
      // Switch to signup
      cy.contains("Don't have an account? Sign up").click();
      
      // Fill registration form
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.contains('Sign Up').click();
      
      // Should show email confirmation
      cy.contains('Check Your Email').should('be.visible');
      cy.contains('test@example.com').should('be.visible');
    });

    it('should login successfully', () => {
      // Open auth modal
      cy.get('[data-testid="auth-button"]').click();
      
      // Fill login form
      cy.get('input[type="email"]').type('existing@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.contains('Sign In').click();
      
      // Should be logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should handle login errors', () => {
      // Open auth modal
      cy.get('[data-testid="auth-button"]').click();
      
      // Fill with invalid credentials
      cy.get('input[type="email"]').type('invalid@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.contains('Sign In').click();
      
      // Should show error
      cy.contains('Invalid credentials').should('be.visible');
    });
  });

  describe('Dashboard Navigation', () => {
    beforeEach(() => {
      // Login before each test
      cy.login('test@example.com', 'password123');
    });

    it('should display market dashboard', () => {
      cy.visit('/');
      
      // Check for dashboard elements
      cy.contains('Market Dashboard').should('be.visible');
      cy.get('[data-testid="crypto-prices"]').should('be.visible');
      cy.get('[data-testid="fear-greed-index"]').should('be.visible');
      cy.get('[data-testid="ai-analysis"]').should('be.visible');
    });

    it('should navigate to historical data', () => {
      cy.get('[data-testid="sidebar-history"]').click();
      cy.url().should('include', '/history');
      cy.contains('Historical Data').should('be.visible');
    });

    it('should navigate to profile', () => {
      cy.get('[data-testid="sidebar-profile"]').click();
      cy.url().should('include', '/profile');
      cy.contains('Profile').should('be.visible');
    });
  });

  describe('Subscription Features', () => {
    beforeEach(() => {
      cy.login('free@example.com', 'password123');
    });

    it('should show upgrade prompts for free users', () => {
      cy.visit('/alerts');
      cy.contains('Upgrade to Pro').should('be.visible');
      
      cy.visit('/settings');
      cy.contains('Upgrade to Pro').should('be.visible');
    });

    it('should allow pro users to access premium features', () => {
      cy.login('pro@example.com', 'password123');
      cy.visit('/alerts');
      cy.contains('Upgrade to Pro').should('not.exist');
      
      cy.visit('/settings');
      cy.contains('Upgrade to Pro').should('not.exist');
    });

    it('should allow premium users to access all features', () => {
      cy.login('premium@example.com', 'password123');
      cy.visit('/advanced-analytics');
      cy.contains('Advanced Analytics').should('be.visible');
      
      cy.visit('/advanced-export');
      cy.contains('Advanced Data Export').should('be.visible');
    });
  });

  describe('Alert System', () => {
    beforeEach(() => {
      cy.login('pro@example.com', 'password123');
    });

    it('should display alerts in header', () => {
      cy.get('[data-testid="alert-icon"]').should('be.visible');
      cy.get('[data-testid="alert-count"]').should('be.visible');
    });

    it('should show alert popup', () => {
      cy.get('[data-testid="alert-icon"]').click();
      cy.get('[data-testid="alert-popup"]').should('be.visible');
    });

    it('should navigate to alerts page', () => {
      cy.get('[data-testid="alert-icon"]').click();
      cy.contains('View All Alerts').click();
      cy.url().should('include', '/alerts');
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      cy.login('premium@example.com', 'password123');
    });

    it('should export data in different formats', () => {
      cy.visit('/advanced-export');
      
      // Select CSV format
      cy.get('[data-testid="format-select"]').select('CSV');
      cy.get('[data-testid="export-button"]').click();
      
      // Should trigger download
      cy.readFile('cypress/downloads/market_data.csv').should('exist');
    });

    it('should schedule exports', () => {
      cy.visit('/advanced-export');
      
      // Enable scheduling
      cy.get('[data-testid="schedule-toggle"]').click();
      cy.get('[data-testid="schedule-frequency"]').select('Daily');
      cy.get('[data-testid="schedule-save"]').click();
      
      cy.contains('Export scheduled successfully').should('be.visible');
    });
  });

  describe('Admin Features', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'password123');
    });

    it('should access admin dashboard', () => {
      cy.visit('/admin');
      cy.contains('Admin Dashboard').should('be.visible');
      cy.get('[data-testid="admin-collections"]').should('be.visible');
    });

    it('should export admin data', () => {
      cy.visit('/admin');
      cy.get('[data-testid="export-users"]').click();
      cy.readFile('cypress/downloads/users_export.json').should('exist');
    });

    it('should view error logs', () => {
      cy.visit('/admin');
      cy.get('[data-testid="error-logs"]').click();
      cy.contains('Error Logs').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');
      cy.visit('/');
      
      // Check mobile menu
      cy.get('[data-testid="mobile-menu"]').should('be.visible');
      cy.get('[data-testid="mobile-menu"]').click();
      cy.get('[data-testid="sidebar"]').should('be.visible');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');
      cy.visit('/');
      
      // Check responsive layout
      cy.get('[data-testid="dashboard-grid"]').should('be.visible');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      cy.intercept('GET', '/api/market-data', { forceNetworkError: true });
      cy.visit('/');
      
      cy.contains('Error loading data').should('be.visible');
      cy.contains('Retry').should('be.visible');
    });

    it('should handle 404 errors', () => {
      cy.visit('/nonexistent-page');
      cy.contains('Page not found').should('be.visible');
    });

    it('should handle server errors', () => {
      cy.intercept('GET', '/api/market-data', { statusCode: 500 });
      cy.visit('/');
      
      cy.contains('Server error').should('be.visible');
    });
  });
});
