import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { nextRouteAfterAuth } from '../../utils/authFlow';

function AuthSplash() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        fontSize: '0.9rem',
      }}
    >
      Carregando...
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  const location = useLocation();

  if (isInitializing) return <AuthSplash />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const expected = nextRouteAfterAuth(user);
  const gatedPaths = ['/user-selection', '/welcome-user'];
  if (gatedPaths.includes(expected) && location.pathname !== expected) {
    return <Navigate to={expected} replace />;
  }

  return children ?? <Outlet />;
}

export function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing, user } = useAuth();
  if (isInitializing) return <AuthSplash />;
  if (isAuthenticated) return <Navigate to={nextRouteAfterAuth(user)} replace />;
  return children ?? <Outlet />;
}
