import type { HTMLAttributes } from 'react';
import { cn } from '../cn';

export type BadgeVariant = 'neutral' | 'sage' | 'clay';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-mist text-ink',
  sage: 'bg-sage text-paper',
  clay: 'bg-clay text-paper',
};

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
