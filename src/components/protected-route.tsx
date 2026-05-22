import { useAuth0 } from '@auth0/auth0-react';
import { AlertCircle, Chrome, Loader2, ShieldCheck } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AUTH0_CONFIG,
  formatAuth0CallbackError,
  formatAuth0Error,
  getAuth0CallbackSearchParams,
  getAuth0LoginOptions,
  getAuth0LogoutOptions,
  isAllowedEmail,
  isAuth0Configured,
  stashAuthNotice,
  validateLogoutReturnTo,
} from '../auth/auth0-config';
import { Button } from './ui/button';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, error: auth0Error, loginWithRedirect, logout, user } = useAuth0();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const returnTo = location.pathname + location.hash;
  const callbackParams = getAuth0CallbackSearchParams(location.search);
  const callbackError = formatAuth0CallbackError(callbackParams.error, callbackParams.errorDescription);
  const isCompletingCallback =
    callbackParams.hasAuthCallback && !callbackParams.hasAuthError && isLoading;

  useEffect(() => {
    if (!callbackParams.hasAuthError || !callbackError) {
      return;
    }

    stashAuthNotice(callbackError);
    navigate('/', { replace: true });
  }, [callbackParams.hasAuthError, callbackError, navigate]);

  useEffect(() => {
    if (!callbackParams.hasAuthCallback || callbackParams.hasAuthError || isLoading) {
      return;
    }

    if (!isAuthenticated) {
      const message = 'Sign-in could not be completed. Please try again.';
      setAuthError(message);
      navigate(location.pathname, { replace: true });
    }
  }, [
    callbackParams.hasAuthCallback,
    callbackParams.hasAuthError,
    isAuthenticated,
    isLoading,
    location.pathname,
    navigate,
  ]);

  useEffect(() => {
    if (!auth0Error) {
      return;
    }

    setAuthError(formatAuth0Error(auth0Error, 'Sign-in could not be completed.'));
  }, [auth0Error]);

  async function startGoogleSignIn() {
    setIsSigningIn(true);
    setAuthError(null);

    try {
      if (!isAuth0Configured()) {
        setAuthError('Auth0 is missing its browser configuration. Check the Vercel Preview VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID variables, then redeploy.');
        return;
      }

      if (isCompletingCallback) {
        return;
      }

      await loginWithRedirect(getAuth0LoginOptions(returnTo));
    } catch (error) {
      setAuthError(formatAuth0Error(error, 'Sign-in could not be started.'));
    } finally {
      setIsSigningIn(false);
    }
  }

  async function signOut() {
    setAuthError(null);

    const logoutValidation = validateLogoutReturnTo();
    if (logoutValidation) {
      setAuthError(logoutValidation);
      return;
    }

    try {
      await logout(getAuth0LogoutOptions());
    } catch (error) {
      setAuthError(formatAuth0Error(error, 'Sign-out could not be completed. Confirm this site origin is in Auth0 Allowed Logout URLs.'));
    }
  }

  if (callbackParams.hasAuthError) {
    return (
      <main className="grid min-h-[calc(100vh-8rem)] place-items-center px-5 py-16">
        <div className="text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold text-muted-foreground">Returning to home...</p>
        </div>
      </main>
    );
  }

  if (isLoading || isCompletingCallback) {
    return (
      <main className="grid min-h-[calc(100vh-8rem)] place-items-center px-5 py-16">
        <div className="text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" />
          <p className="mt-4 text-sm font-semibold text-muted-foreground">
            {isCompletingCallback ? 'Completing Google sign-in...' : 'Checking your session...'}
          </p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-[86rem] place-items-center px-5 py-16 sm:px-8 lg:px-12">
        <section className="w-full max-w-xl rounded-[2rem] border border-border bg-card/95 p-6 text-center shadow-premium sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-normal text-foreground">Sign in to your workspace</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
            Continue with Google using your @{AUTH0_CONFIG.allowedEmailDomain} account to access saved resumes, profile settings, and the review dashboard.
          </p>

          {authError ? (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-xs font-semibold leading-5 text-amber-800 dark:border-amber-400/40 dark:bg-amber-950/50 dark:text-amber-100">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {authError}
            </p>
          ) : null}

          <Button
            type="button"
            className="mt-6 h-12 w-full sm:w-auto sm:min-w-64"
            onClick={startGoogleSignIn}
            disabled={isSigningIn || isCompletingCallback}
          >
            {isSigningIn ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Chrome className="size-4" aria-hidden="true" />}
            Continue with Google
          </Button>
        </section>
      </main>
    );
  }

  if (!isAllowedEmail(user?.email)) {
    return (
      <main className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-[86rem] place-items-center px-5 py-16 sm:px-8 lg:px-12">
        <section className="w-full max-w-xl rounded-[2rem] border border-border bg-card/95 p-6 text-center shadow-premium sm:p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <AlertCircle className="size-7" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-3xl font-black tracking-normal text-foreground">UW email required</h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
            Husky-Review is limited to Google accounts using an @{AUTH0_CONFIG.allowedEmailDomain} email address.
          </p>
          <Button type="button" className="mt-6 h-12" onClick={signOut}>
            Sign out
          </Button>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}
