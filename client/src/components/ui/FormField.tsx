import type { ReactNode } from 'react';
import { Label } from './Input';

interface FormFieldProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, required, description, error, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>
        {label}
        {required && <span className="mr-1 text-destructive">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}
