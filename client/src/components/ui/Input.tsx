import type { InputHTMLAttributes, LabelHTMLAttributes } from 'react';

export function Label({ className = '', ...rest }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground ${className}`}
      {...rest}
    />
  );
}

export function Input({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-9 w-full rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive ${className}`}
      {...rest}
    />
  );
}
