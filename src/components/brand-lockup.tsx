import { cn } from '../lib/utils';

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden">
        <img src="/husky-mark.svg" alt="" width={40} height={40} className="size-full object-contain" decoding="async" />
      </span>
      <span className="block truncate text-[1.55rem] font-black leading-none tracking-normal text-husky-purple dark:text-foreground">
        Husky-Review
      </span>
    </span>
  );
}
