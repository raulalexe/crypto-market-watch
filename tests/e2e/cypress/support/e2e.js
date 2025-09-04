// E2E test support file

// Import commands
import './commands';

// Global test configuration
beforeEach(() => {
  // Reset any state before each test
  cy.clearLocalStorage();
  cy.clearCookies();
});

// Custom assertions
Cypress.Commands.add('shouldHaveValidMarketData', () => {
  cy.get('[data-testid="crypto-prices"]').should('be.visible');
  cy.get('[data-testid="fear-greed-index"]').should('be.visible');
  cy.get('[data-testid="ai-analysis"]').should('be.visible');
});

Cypress.Commands.add('shouldShowUpgradePrompt', () => {
  cy.contains('Upgrade to Pro').should('be.visible');
});

Cypress.Commands.add('shouldNotShowUpgradePrompt', () => {
  cy.contains('Upgrade to Pro').should('not.exist');
});

// Mock data for tests
const mockMarketData = [
  {
    id: 1,
    symbol: 'BTC',
    price: 50000,
    change_24h: 2.5,
    market_cap: 1000000000000,
    volume_24h: 50000000000
  }
];

const mockFearGreedIndex = {
  value: 65,
  classification: 'Greed'
};

const mockAiAnalysis = {
  short_term: { direction: 'BULLISH', confidence: 0.8 },
  medium_term: { direction: 'NEUTRAL', confidence: 0.6 },
  long_term: { direction: 'BULLISH', confidence: 0.7 }
};

// Export mock data for use in tests
Cypress.env('mockData', {
  marketData: mockMarketData,
  fearGreedIndex: mockFearGreedIndex,
  aiAnalysis: mockAiAnalysis
});
