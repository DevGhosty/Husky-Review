import type { ReactNode } from 'react';
import type { Ref } from 'react';
import { cn } from '../../lib/utils';
import { useInViewReveal } from '../../hooks/useInViewReveal';

interface SectionProps {
  id?: string;
  className?: string;
  children: ReactNode;
  /** When false, skip intersection reveal (e.g. above-the-fold hero). Default true. */
  reveal?: boolean;
}

export function Section({ id, className, children, reveal = true }: SectionProps) {
  const { ref, isRevealed } = useInViewReveal<HTMLElement>(reveal);

  return (
    <section
      id={id}
      ref={ref as Ref<HTMLElement>}
      className={cn(
        reveal &&
          'motion-safe:translate-y-2 motion-safe:opacity-0 motion-safe:transition-[opacity,transform] motion-safe:duration-motion-reveal motion-safe:ease-brand',
        reveal && isRevealed && 'motion-safe:translate-y-0 motion-safe:opacity-100',
        'motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        className,
      )}
    >
      {children}
    </section>
  );
}
