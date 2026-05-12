import type { ReactNode } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { Button } from './ui/button';

interface AppShellProps {
  children: ReactNode;
  onStartReview: () => void;
}

export function AppShell({ children, onStartReview }: AppShellProps) {
  return (
    <div className="min-h-screen bg-husky-cloud text-husky-ink">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <a href="#top" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-husky-gold">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-husky-purple text-white shadow-soft">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight text-husky-purple-dark">Husky-Review</span>
              <span className="block text-xs font-medium text-husky-muted">Actionable UWB Resume Review</span>
            </span>
          </a>
          <div className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <a href="#workflow" className="transition hover:text-husky-purple">
              How it works
            </a>
            <a href="#recommendations" className="transition hover:text-husky-purple">
              Recommendations
            </a>
            <a href="#privacy" className="transition hover:text-husky-purple">
              Privacy
            </a>
          </div>
          <Button className="hidden px-4 py-2.5 sm:inline-flex" onClick={onStartReview}>
            Analyze resume
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      </header>
      {children}
    </div>
  );
}
