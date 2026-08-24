import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
}

export function BrandMark({ className }: Readonly<BrandMarkProps>) {
  return (
    <img
      src="/pennywise-logo.png"
      alt=""
      className={cn('h-8 w-8 shrink-0 rounded-lg object-cover sm:h-9 sm:w-9', className)}
      aria-hidden="true"
    />
  );
}
