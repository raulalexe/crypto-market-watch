// API Configuration Service
// This service provides the correct backend API URL based on the environment

const getApiBaseUrl = () => {
  // In development, use the proxy (localhost:3001)
  if (process.env.NODE_ENV === 'development') {
    return '';
  }
  
  // In production, use the environment variable or fallback to relative URLs
  return process.env.REACT_APP_API_URL || '';
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint) => {
  const baseUrl = getApiBaseUrl();
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseUrl}${cleanEndpoint}`;
};

// Export the base URL for components that need it
export const API_BASE_URL = getApiBaseUrl();

// Default export for backward compatibility
export default {
  buildApiUrl,
  API_BASE_URL
};
