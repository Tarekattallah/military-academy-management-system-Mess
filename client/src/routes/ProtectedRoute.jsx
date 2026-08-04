
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';






export function ProtectedRoute({ children, requiredPermission }) {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">Loading…</p>
      </div>);

  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  // If a requiredPermission is specified, check it
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}