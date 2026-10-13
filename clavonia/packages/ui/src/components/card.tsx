import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-6 text-ink shadow-sm',
        className,
      )}
      {...props}
    />
  );
}
