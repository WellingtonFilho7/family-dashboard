import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

export function SectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        'mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </h2>
  );
}
