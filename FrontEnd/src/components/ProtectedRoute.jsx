import { Navigate, Outlet } from 'react-router-dom';
import { authClient } from '../lib/auth-client';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-body)',
          background: 'var(--bg-canvas)',
        }}
      >
        Cargando…
      </div>
    );
  }

  if (!session?.user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(session.user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
