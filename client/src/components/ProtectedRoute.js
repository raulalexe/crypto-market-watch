import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated, fallbackPath = '/app?auth=login' }) => {
  // Allow free access to all routes - no authentication required
  return children;
};

export default ProtectedRoute;
