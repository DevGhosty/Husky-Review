import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { BrandLockup } from './brand-lockup';
import { NotificationsPanel } from './notifications-panel';
import { ProfileMenu } from './profile-menu';
import { ThemeToggle } from './theme-toggle';
import { cn } from '../lib/utils';

interface AppShellProps {
  children: ReactNode;
}

const navItems = [
  { label: 'Dashboard', to: '/app' },
  { label: 'Roadmap', to: '/app/roadmap' },
  { label: 'Resources', to: '/app/resources' },
  { label: 'Saved Reviews', to: '/app/saved-reviews' },
  { label: 'Privacy', to: '/app/privacy' },
  { label: 'Profile', to: '/app/profile' },
];

const navLinkFocus =
  'rounded-lg px-2 py-2 outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background';

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden px-3 py-3 text-foreground sm:px-5 sm:py-6">
      <div className="app-frame mx-auto max-w-[92rem] rounded-[var(--radius-shell,1.8rem)]">
        <header className="border-b border-border bg-card/90 backdrop-blur-xl">
          <nav className="flex min-h-[4.65rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8" aria-label="Main navigation">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                to="/app"
                aria-label="Husky-Review dashboard"
                className={cn('min-w-0 rounded-xl', navLinkFocus)}
              >
                <BrandLockup />
              </Link>
              <span className="hidden h-7 w-px bg-border lg:block" aria-hidden="true" />
              <span className="hidden truncate text-[0.95rem] font-medium text-muted-foreground xl:block">
                Actionable UW Resume Review
              </span>
            </div>

            <div className="hidden items-center gap-6 text-[0.95rem] font-semibold text-muted-foreground lg:flex">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/app'}
                  className={({ isActive }) =>
                    cn(
                      navLinkFocus,
                      'relative text-muted-foreground hover:text-primary',
                      isActive && 'font-black text-primary',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {item.label}
                      {isActive && (
                        <span
                          className="absolute inset-x-1 -bottom-2.5 h-0.5 rounded-full bg-primary shadow-[0_0_16px_rgba(75,46,131,0.28)] dark:bg-primary dark:shadow-[0_0_14px_oklch(0.85_0.05_300_/_0.35)]"
                          aria-hidden="true"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <NotificationsPanel />
              <ProfileMenu />
            </div>
          </nav>
          <div className="border-t border-border/80 px-4 py-3 lg:hidden" aria-label="Section navigation">
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.to === '/app'}
                  className={({ isActive }) =>
                    cn(
                      'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-black transition-[color,background-color,border-color,transform] duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.98]',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border bg-card/85 text-muted-foreground hover:border-husky-gold hover:text-primary dark:hover:border-primary/50',
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
