import axios from 'axios';
import logger from '../utils/logger';

class AuthService {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token expiration
    axios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        // Handle JWT signature errors (403 with invalid signature)
        if (error.response?.status === 403 && 
            error.response?.data?.code === 'INVALID_SIGNATURE') {
          console.log('🚨 JWT signature mismatch detected - clearing tokens and redirecting to login');
          this.clearTokens();
          window.location.href = '/?auth=login&reason=token_invalid';
          return Promise.reject(error);
        }

        // Handle 401 errors (token expired)
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then(token => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return axios(originalRequest);
            }).catch(err => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh the token
            const newToken = await this.refreshToken();
            if (newToken) {
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              
              // Process the failed queue
              this.processQueue(null, newToken);
              
              return axios(originalRequest);
            } else {
              // Refresh failed, redirect to login
              this.handleAuthFailure();
              return Promise.reject(error);
            }
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.handleAuthFailure();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle 403 errors (forbidden)
        if (error.response?.status === 403) {
          // Check if it's a token expiration issue
          if (error.response?.data?.error === 'Invalid token' || 
              error.response?.data?.error === 'Token expired') {
            this.handleAuthFailure();
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async refreshToken() {
    // For now, we don't have a refresh token endpoint
    // So we'll return null to trigger re-authentication
    return null;
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  handleAuthFailure() {
    // Clear stored tokens
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastSeenAlertId');
    
    // Remove auth header from axios defaults
    delete axios.defaults.headers.common['Authorization'];
    
    // Show user-friendly message
    this.showSessionExpiredMessage();
    
    // Redirect to login after a short delay
    setTimeout(() => {
      // Check if we're in the app, redirect to login
      if (window.location.pathname.startsWith('/app')) {
        window.location.href = '/app?auth=login';
      } else {
        window.location.href = '/?auth=login';
      }
    }, 2000);
  }

  showSessionExpiredMessage() {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 max-w-sm';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span>Your session has expired. Please log in again.</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Method to clear tokens without redirecting
  clearTokens() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('lastSeenAlertId');
    localStorage.removeItem('token'); // Clear any old token storage
    delete axios.defaults.headers.common['Authorization'];
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Method to manually clear auth and redirect
  logout() {
    this.handleAuthFailure();
  }

  // Method to check if user is authenticated
  isAuthenticated() {
    const token = localStorage.getItem('authToken');
    if (!token) return false;
    
    try {
      // Decode JWT to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      
      if (payload.exp < currentTime) {
        // Token is expired
        this.handleAuthFailure();
        return false;
      }
      
      return true;
    } catch (error) {
      // Invalid token format
      this.handleAuthFailure();
      return false;
    }
  }

  // Method to get current user data
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      return null;
    }
  }
}

// Create and export a singleton instance
const authService = new AuthService();
export default authService;
