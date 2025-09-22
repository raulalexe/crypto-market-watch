// API Configuration Service
// This service provides the correct backend API URL based on the environment

const getApiBaseUrl = () => {
  // Always use relative URLs (same domain)
  // This works for both development (proxy) and production (same domain)
  return '';
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
