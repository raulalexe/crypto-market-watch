# Testing Guide for Crypto Market Watch

## Overview

This project includes a comprehensive test suite covering unit tests, integration tests, and end-to-end tests for both API and UI components.

## Test Structure

```
tests/
├── unit/                          # Unit tests for individual functions
│   ├── simple-api.test.js        # Core API functionality tests
│   ├── api.test.js               # Comprehensive API endpoint tests
│   ├── auth.test.js              # Authentication flow tests
│   ├── telegram.test.js          # Telegram integration tests
│   ├── notification-preferences.test.js # Notification system tests
│   └── logout.test.js            # Logout functionality and page reload tests
├── integration/                   # Integration tests for component interactions
│   └── frontend.test.js          # Frontend component integration tests
├── e2e/                          # End-to-end tests
│   └── cypress/                  # Cypress E2E test framework
│       ├── e2e/
│       │   └── user-journey.cy.js # Complete user journey tests
│       ├── fixtures/             # Test data fixtures
│       └── support/              # Custom commands and utilities
├── helpers/                      # Test helper functions and utilities
│   └── testHelpers.js           # Shared test utilities
└── __mocks__/                    # Mock files for static assets
    └── fileMock.js              # File mock for images, etc.
```

## Running Tests

### Quick Test Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:api           # API tests only
npm run test:auth          # Authentication tests only
npm run test:frontend      # Frontend tests only
npm test tests/unit/logout.test.js # Logout functionality tests

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e           # Headless mode
npm run test:e2e:open      # Interactive mode
```

### Comprehensive Test Runner

Use the custom test runner for a complete overview:

```bash
# Run all tests with detailed reporting
node run-tests.js

# Run specific test categories
node run-tests.js --unit
node run-tests.js --api --auth
node run-tests.js --all
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation.

**Coverage**:
- API endpoint functionality
- Authentication flows
- Telegram integration
- Notification preferences
- Database operations
- Utility functions

**Example**:
```javascript
describe('API Endpoints Tests', () => {
  it('should return market data', async () => {
    const response = await request(app)
      .get('/api/market-data')
      .expect(200);

    expect(response.body).toBeInstanceOf(Array);
    expect(response.body.length).toBeGreaterThan(0);
  });
});
```

### 2. Integration Tests

**Purpose**: Test how different components work together.

**Coverage**:
- Frontend component interactions
- API integration with frontend
- Authentication state management
- Data flow between components

**Example**:
```javascript
describe('Frontend Integration Tests', () => {
  it('should render dashboard with market data', async () => {
    const Dashboard = require('../../client/src/components/Dashboard').default;
    renderWithRouter(<Dashboard />);

    expect(screen.getByText('Market Dashboard')).toBeInTheDocument();
  });
});
```

### 3. End-to-End Tests

**Purpose**: Test complete user journeys from start to finish.

**Coverage**:
- User registration and login
- Dashboard navigation
- Subscription management
- Alert system
- Data export functionality
- Admin features
- Responsive design

**Example**:
```javascript
describe('User Journey Tests', () => {
  it('should complete registration with email confirmation', () => {
    cy.get('[data-testid="auth-button"]').click();
    cy.contains("Don't have an account? Sign up").click();
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.contains('Sign Up').click();
    cy.contains('Check Your Email').should('be.visible');
  });
});
```

## Test Configuration

### Jest Configuration

The project uses Jest for unit and integration tests with the following configuration:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
  // ... other configurations
};
```

### Cypress Configuration

E2E tests use Cypress with custom commands and fixtures:

```javascript
// cypress.config.js
module.exports = {
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'tests/e2e/cypress/support/e2e.js',
    specPattern: 'tests/e2e/cypress/e2e/**/*.cy.js'
  }
};
```

## Test Data and Fixtures

### Mock Data

The tests use consistent mock data for predictable results:

```javascript
// Mock API responses
const mockApiResponses = {
  marketData: [
    {
      id: 1,
      symbol: 'BTC',
      price: 50000,
      change_24h: 2.5,
      market_cap: 1000000000000,
      volume_24h: 50000000000
    }
  ],
  fearGreedIndex: {
    value: 65,
    classification: 'Greed'
  },
  // ... more mock data
};
```

### Fixtures

E2E tests use JSON fixtures for consistent test data:

```json
// tests/e2e/cypress/fixtures/market-data.json
[
  {
    "id": 1,
    "symbol": "BTC",
    "price": 50000,
    "change_24h": 2.5,
    "market_cap": 1000000000000,
    "volume_24h": 50000000000
  }
]
```

## Test Utilities

### Helper Functions

The `testHelpers.js` file provides reusable utilities:

```javascript
// Create test JWT tokens
const createTestToken = (userId = 1, role = 'user', plan = 'free') => {
  return jwt.sign(
    { userId, role, plan, email: `test${userId}@example.com` },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

// Mock user data
const createMockUser = (overrides = {}) => {
  return {
    id: 1,
    email: 'test@example.com',
    password: bcrypt.hashSync('password123', 10),
    role: 'user',
    plan: 'free',
    email_confirmed: true,
    ...overrides
  };
};
```

### Custom Cypress Commands

```javascript
// tests/e2e/cypress/support/commands.js
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/');
  cy.get('[data-testid="auth-button"]').click();
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.contains('Sign In').click();
  cy.get('[data-testid="user-menu"]').should('be.visible');
});
```

## Best Practices

### 1. Test Organization

- Group related tests in `describe` blocks
- Use descriptive test names that explain the expected behavior
- Follow the AAA pattern: Arrange, Act, Assert

### 2. Mocking

- Mock external dependencies (APIs, databases, services)
- Use consistent mock data across tests
- Avoid mocking the code under test

### 3. Assertions

- Use specific assertions that test the exact behavior
- Test both positive and negative cases
- Verify error handling and edge cases

### 4. Test Data

- Use factories or builders for creating test data
- Keep test data minimal and focused
- Use meaningful names and values

### 5. Async Testing

- Always await async operations
- Use proper timeout handling
- Test loading states and error conditions

## Continuous Integration

The test suite is designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    npm run test:coverage
    npm run test:e2e
```

## Coverage Goals

The project aims for the following test coverage:

- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 70%+
- **Statements**: 70%+

## Troubleshooting

### Common Issues

1. **Tests failing due to missing dependencies**
   ```bash
   npm install --save-dev @babel/preset-env @babel/preset-react
   ```

2. **Mock issues with ES modules**
   - Use `jest.mock()` at the top level
   - Avoid referencing out-of-scope variables in mocks

3. **Cypress tests timing out**
   - Increase timeout values
   - Use `cy.wait()` for API calls
   - Check for proper element selectors

4. **Database connection issues in tests**
   - Use in-memory databases for testing
   - Mock database operations
   - Clean up test data after each test

### Debug Mode

Run tests in debug mode for detailed output:

```bash
# Jest debug mode
npm test -- --verbose

# Cypress debug mode
npm run test:e2e:open
```

## Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all tests pass
3. Maintain or improve coverage
4. Update this documentation if needed

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Cypress Documentation](https://docs.cypress.io/)
- [Testing Library Documentation](https://testing-library.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
