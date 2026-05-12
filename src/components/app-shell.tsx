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
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/[0.78] shadow-[0_10px_35px_rgba(28,23,54,0.06)] backdrop-blur-2xl">
        <nav
          className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          <a href="#top" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-husky-gold">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-husky-purple to-husky-purple-dark text-white shadow-soft ring-1 ring-white/70">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-tight text-husky-purple-dark">Husky-Review</span>
              <span className="block text-xs font-medium text-husky-muted">Actionable UWB Resume Review</span>
            </span>
          </a>
          <div className="hidden items-center gap-1 rounded-full border border-husky-line/80 bg-white/75 p-1 text-sm font-semibold text-slate-600 shadow-soft md:flex">
            <a href="#workflow" className="rounded-full px-4 py-2 transition hover:bg-husky-purple/[0.08] hover:text-husky-purple">
              How it works
            </a>
            <a href="#recommendations" className="rounded-full px-4 py-2 transition hover:bg-husky-purple/[0.08] hover:text-husky-purple">
              Recommendations
            </a>
            <a href="#privacy" className="rounded-full px-4 py-2 transition hover:bg-husky-purple/[0.08] hover:text-husky-purple">
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
