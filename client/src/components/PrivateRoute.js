import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const PrivateRoute = ({ children, requiredRole, requiredPermission }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Super admin has access to everything
  if (userData?.isSuperAdmin || userData?.canAccessEverything) {
    return children;
  }

  // Check if user has the required role
  if (requiredRole && userData?.role !== requiredRole) {
    // Redirect based on user role
    switch (userData?.role) {
      case 'super_admin':
        return <Navigate to="/super-admin" replace />;
      case 'restaurant_admin':
        return <Navigate to="/restaurant" replace />;
      case 'waiter':
        return <Navigate to="/waiter" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  // Check if user has the required permission
  if (requiredPermission && userData?.permissions) {
    const hasPermission = userData.permissions.includes(requiredPermission) || 
                         userData.permissions.includes('super_admin_access');
    if (!hasPermission) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default PrivateRoute;
