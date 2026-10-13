import type { InputHTMLAttributes } from 'react';
import { cn } from '../cn';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-ink placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}
