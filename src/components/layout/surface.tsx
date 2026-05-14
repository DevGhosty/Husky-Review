import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

const variantClass = {
  glass: 'glass-card',
  premium: 'premium-panel',
  card: 'premium-card',
  plain: 'rounded-2xl border border-border/90 bg-card/90 text-card-foreground shadow-soft backdrop-blur-sm dark:bg-card/85',
  dark: 'rounded-[2rem] bg-husky-purple-dark text-white shadow-premium',
  darkInset: 'rounded-2xl border border-white/10 bg-white/[0.08]',
  stroke:
    'rounded-[1.6rem] border border-dashed border-primary/25 bg-muted/35 text-foreground shadow-soft dark:bg-muted/25 dark:border-primary/35',
} as const;

export type SurfaceVariant = keyof typeof variantClass;

interface SurfaceProps extends HTMLAttributes<HTMLDivElement> {
  variant: SurfaceVariant;
  children: ReactNode;
}

export function Surface({ variant, className, children, ...rest }: SurfaceProps) {
  return (
    <div className={cn(variantClass[variant], className)} {...rest}>
      {children}
    </div>
  );
}
