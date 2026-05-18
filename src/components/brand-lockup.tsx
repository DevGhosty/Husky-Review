import { cn } from '../lib/utils';

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <span className="relative grid size-10 shrink-0 place-items-center">
        <img
          src="/logos/husky-review-resume-spark.svg"
          alt="Husky-Review logo"
          width={40}
          height={40}
          className="size-full object-contain"
          decoding="async"
        />
      </span>
      <span className="font-heading block truncate text-[1.55rem] font-extrabold leading-none tracking-tight text-husky-purple dark:text-foreground">
        Husky-Review
      </span>
    </span>
  );
}
