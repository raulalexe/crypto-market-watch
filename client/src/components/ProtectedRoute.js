import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, isAuthenticated, fallbackPath = '/app?auth=login' }) => {
  // If freemium is disabled, require authentication for all routes
  const freemiumDisabled = process.env.REACT_APP_DISABLE_FREEMIUM === 'true';
  
  if (freemiumDisabled && !isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
};

export default ProtectedRoute;
