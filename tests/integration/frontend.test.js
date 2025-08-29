import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// Import components
import Dashboard from '../../client/src/components/Dashboard';
import AuthModal from '../../client/src/components/AuthModal';
import Profile from '../../client/src/components/Profile';
import AlertCard from '../../client/src/components/AlertCard';

// Mock axios
jest.mock('axios');
const axios = require('axios');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Dashboard Component', () => {
    it('should render dashboard with market data', async () => {
      // Mock API responses
      axios.get.mockResolvedValueOnce({
        data: [
          { symbol: 'BTC', price: 50000, change_24h: 2.5 }
        ]
      });

      axios.get.mockResolvedValueOnce({
        data: {
          value: 65,
          classification: 'Greed'
        }
      });

      axios.get.mockResolvedValueOnce({
        data: {
          short_term: { direction: 'BULLISH', confidence: 0.8 },
          medium_term: { direction: 'NEUTRAL', confidence: 0.6 },
          long_term: { direction: 'BULLISH', confidence: 0.7 }
        }
      });

      renderWithRouter(<Dashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Market Dashboard')).toBeInTheDocument();
      });

      // Check if market data is displayed
      expect(screen.getByText('BTC')).toBeInTheDocument();
      expect(screen.getByText('$50,000')).toBeInTheDocument();
    });

    it('should show loading state initially', () => {
      renderWithRouter(<Dashboard />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      axios.get.mockRejectedValueOnce(new Error('API Error'));

      renderWithRouter(<Dashboard />);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('AuthModal Component', () => {
    it('should render login form by default', () => {
      render(
        <AuthModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onAuthSuccess={jest.fn()} 
        />
      );

      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    });

    it('should switch to signup form', () => {
      render(
        <AuthModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onAuthSuccess={jest.fn()} 
        />
      );

      fireEvent.click(screen.getByText("Don't have an account? Sign up"));
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('should handle login submission', async () => {
      const onAuthSuccess = jest.fn();
      const onClose = jest.fn();

      axios.post.mockResolvedValueOnce({
        data: {
          token: 'test-token',
          user: { id: 1, email: 'test@example.com' }
        }
      });

      render(
        <AuthModal 
          isOpen={true} 
          onClose={onClose} 
          onAuthSuccess={onAuthSuccess} 
        />
      );

      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByText('Sign In'));

      await waitFor(() => {
        expect(axios.post).toHaveBeenCalledWith('/api/auth/login', {
          email: 'test@example.com',
          password: 'password123'
        });
      });

      expect(onAuthSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle registration with email confirmation', async () => {
      const onAuthSuccess = jest.fn();
      const onClose = jest.fn();

      axios.post.mockResolvedValueOnce({
        data: {
          requiresConfirmation: true,
          message: 'Please check your email to confirm your account'
        }
      });

      render(
        <AuthModal 
          isOpen={true} 
          onClose={onClose} 
          onAuthSuccess={onAuthSuccess} 
        />
      );

      // Switch to signup
      fireEvent.click(screen.getByText("Don't have an account? Sign up"));

      fireEvent.change(screen.getByPlaceholderText('Enter your email'), {
        target: { value: 'test@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your password'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByText('Sign Up'));

      await waitFor(() => {
        expect(screen.getByText('Check Your Email')).toBeInTheDocument();
      });

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  describe('Profile Component', () => {
    it('should redirect unauthenticated users', () => {
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true
      });

      renderWithRouter(<Profile />);

      expect(mockLocation.href).toContain('/auth-required');
    });

    it('should display user profile for authenticated users', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      axios.get.mockResolvedValueOnce({
        data: {
          id: 1,
          email: 'test@example.com',
          plan: 'pro',
          role: 'user',
          subscriptionStatus: 'active'
        }
      });

      renderWithRouter(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Pro')).toBeInTheDocument();
      });
    });

    it('should allow editing profile information', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      axios.get.mockResolvedValueOnce({
        data: {
          id: 1,
          email: 'test@example.com',
          plan: 'pro',
          role: 'user',
          subscriptionStatus: 'active'
        }
      });

      renderWithRouter(<Profile />);

      await waitFor(() => {
        expect(screen.getByText('Edit')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Edit'));

      const emailInput = screen.getByDisplayValue('test@example.com');
      fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

      expect(emailInput.value).toBe('newemail@example.com');
    });
  });

  describe('AlertCard Component', () => {
    it('should display alerts for authenticated users', async () => {
      localStorageMock.getItem.mockReturnValue('test-token');

      axios.get.mockResolvedValueOnce({
        data: [
          {
            id: 1,
            alert_type: 'price_alert',
            message: 'Bitcoin price alert',
            created_at: '2024-01-01T00:00:00Z'
          }
        ]
      });

      renderWithRouter(<AlertCard />);

      await waitFor(() => {
        expect(screen.getByText('Bitcoin price alert')).toBeInTheDocument();
      });
    });

    it('should show upgrade prompt for unauthenticated users', () => {
      localStorageMock.getItem.mockReturnValue(null);

      renderWithRouter(<AlertCard />);

      expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
    });
  });

  describe('Navigation and Routing', () => {
    it('should navigate between pages correctly', () => {
      // This would test navigation between different routes
      // Implementation depends on your routing setup
    });

    it('should handle authentication-required routes', () => {
      // This would test that protected routes redirect to auth
      // Implementation depends on your routing setup
    });
  });
});
