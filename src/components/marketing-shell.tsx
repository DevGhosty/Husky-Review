import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
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
              <Button asChild variant="secondary" className="hidden h-10 sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild className="h-10">
                <Link to="/login">
                  Start Review
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </nav>
        </header>
        {children}
        <footer className="border-t border-border bg-card/85 px-5 py-10 backdrop-blur-sm sm:px-8 lg:px-12">
          <div className="mx-auto grid max-w-[86rem] gap-4 text-sm font-semibold leading-6 text-muted-foreground md:grid-cols-[1fr_auto] md:items-center">
            <p>
              Husky-Review is a mocked career readiness frontend for UW Bothell students. No real resume data is stored or analyzed in
              this version.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link className="text-primary transition-colors hover:text-primary/90 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" to="/login">
                Sign in preview
              </Link>
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
