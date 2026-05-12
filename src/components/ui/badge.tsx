import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type BadgeTone = 'purple' | 'gold' | 'green' | 'gray' | 'amber';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  purple: 'border-husky-purple/[0.15] bg-husky-purple/[0.08] text-husky-purple',
  gold: 'border-husky-gold/30 bg-husky-gold/[0.15] text-husky-purple-dark',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  gray: 'border-slate-200 bg-white text-slate-600',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
};

export function Badge({ className, tone = 'gray', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-semibold leading-none',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
