import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireRole = false 
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only redirect to role selection if:
  // 1. The route requires a role
  // 2. The user doesn't have a role
  // 3. We're not already on the role selection page
  if (requireRole && !profile?.role && window.location.pathname !== '/role-selection') {
    return <Navigate to="/role-selection" replace />;
  }

  // If we're on role selection page but user already has a role,
  // redirect to dashboard
  if (window.location.pathname === '/role-selection' && profile?.role) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;