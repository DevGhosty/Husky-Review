import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { getAuth0LoginOptions } from '../auth/auth0-config';
import { BrandLockup } from './brand-lockup';
import { ThemeToggle } from './theme-toggle';
import { Button } from './ui/button';

interface MarketingShellProps {
  children: ReactNode;
}

const hashLinkClass =
  'rounded-lg px-2 py-2 font-semibold text-muted-foreground outline-none transition-colors duration-200 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function MarketingShell({ children }: MarketingShellProps) {
  const location = useLocation();
  const { loginWithRedirect } = useAuth0();

  useEffect(() => {
    const id = location.hash.replace(/^#/, '');
    if (!id) {
      return;
    }
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const startAuthLogin = async () => {
    await loginWithRedirect(getAuth0LoginOptions('/app'));
  };

  return (
    <div className="min-h-screen overflow-x-hidden px-3 py-3 text-foreground sm:px-5 sm:py-6">
      <div className="app-frame mx-auto max-w-[92rem] rounded-[var(--radius-shell,1.8rem)]">
        <header className="border-b border-border bg-card/90 backdrop-blur-xl">
          <nav className="flex min-h-[4.65rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Public navigation">
            <Link
              to="/"
              aria-label="Husky-Review home"
              className="min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <BrandLockup />
            </Link>
            <div className="hidden items-center gap-6 text-[0.95rem] md:flex">
              <Link to="/#how-it-works" className={hashLinkClass}>
                How it works
              </Link>
              <Link to="/#trust" className={hashLinkClass}>
                Privacy
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button className="h-10" onClick={startAuthLogin}>
                Sign in
              </Button>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-border bg-card/85 px-5 py-10 backdrop-blur-sm sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[86rem] gap-4 text-sm font-semibold leading-6 text-muted-foreground md:grid-cols-[1fr_auto] md:items-center">
            <p>
              Husky-Review stores account profile settings and uploaded resumes after sign-in. Analysis results remain mocked until the
              review pipeline is connected.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                type="button"
                onClick={startAuthLogin}
                className="text-primary transition-colors hover:text-primary/90 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Sign in
              </button>
              <Link className="text-primary transition-colors hover:text-primary/90 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" to="/app/privacy">
                Privacy center
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
