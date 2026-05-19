import { useAuth0 } from '@auth0/auth0-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * ProtectedRoute component gates access to authenticated app routes
 * Redirects unauthenticated users directly to Auth0 Universal Login
 * Shows loading state while Auth0 session is being verified
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const redirectStartedRef = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      redirectStartedRef.current = false;
      return;
    }

    if (!isLoading && !redirectStartedRef.current) {
      redirectStartedRef.current = true;
      void loginWithRedirect({
        appState: { returnTo: location.pathname + location.search + location.hash },
      });
    }
  }, [isAuthenticated, isLoading, loginWithRedirect, location.hash, location.pathname, location.search]);

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">Redirecting to Auth0...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
