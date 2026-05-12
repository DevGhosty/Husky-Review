import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'dark';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-husky-purple to-husky-purple-dark text-white shadow-glow hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(75,46,131,0.32)]',
  secondary:
    'border border-husky-purple/20 bg-white/[0.9] text-husky-purple shadow-soft hover:-translate-y-0.5 hover:border-husky-gold/70 hover:bg-white hover:shadow-card',
  ghost: 'text-husky-purple hover:bg-husky-purple/[0.08]',
  dark: 'bg-husky-ink text-white shadow-card hover:-translate-y-0.5 hover:bg-husky-purple-dark hover:shadow-premium',
};

export function Button({ className, variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl px-5 py-3 text-sm font-semibold transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-husky-gold disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
