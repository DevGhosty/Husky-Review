import { useCallback, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { isDarkMode, setTheme } from '../lib/theme';
import { cn } from '../lib/utils';

const navToggleClass =
  'grid size-11 place-items-center rounded-full border border-border bg-card text-foreground shadow-soft ring-1 ring-border/60 transition-[color,box-shadow,transform,border-color] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:hover:-translate-y-0.5 active:scale-[0.98]';

export function ThemeToggle({ className }: { className?: string }) {
  const [dark, setDark] = useState(() => isDarkMode());

  const toggle = useCallback(() => {
    const next = !isDarkMode();
    setTheme(next ? 'dark' : 'light');
    setDark(next);
  }, []);

  return (
    <button
      type="button"
      className={cn(navToggleClass, className)}
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-pressed={dark}
    >
      {dark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
    </button>
  );
}
