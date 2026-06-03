import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeTone = 'purple' | 'gold' | 'goldOnDark' | 'green' | 'gray' | 'amber' | 'onDark';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  purple:
    'border-husky-purple/[0.15] bg-husky-purple/[0.08] text-husky-purple dark:border-white/18 dark:bg-white/12 dark:text-white',
  gold:
    'badge-gold border-husky-gold/30 bg-husky-gold/[0.15] dark:border-amber-400/35 dark:bg-amber-400/14',
  goldOnDark:
    'border-husky-gold/35 bg-husky-gold/15 text-husky-gold-bright dark:border-amber-400/35 dark:bg-amber-400/14 dark:text-amber-100',
  green:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-950/60 dark:text-emerald-200',
  gray:
    'border-border bg-card text-muted-foreground dark:bg-muted dark:text-muted-foreground',
  amber:
    'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/40 dark:bg-amber-950/55 dark:text-amber-100',
  onDark:
    'border-white/20 bg-white/10 text-white',
};

export function Badge({ className, tone = 'gray', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'font-ui inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold leading-none',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
