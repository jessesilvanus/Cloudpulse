import React, { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { LoadingState } from '../ui/States.tsx';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingState message="Verifying CLOUDPULSE identity & session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If brand-new user with incomplete onboarding attempts to access dashboard before skipping/completing
  if (
    user &&
    user.onboardingCompleted === false &&
    location.pathname !== '/onboarding' &&
    !location.pathname.startsWith('/settings/cloud-connections')
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
