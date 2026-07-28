import * as React from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}

export function Dialog({ open, onOpenChange, title, description, children, footer }: DialogProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full max-w-[calc(100vw-0.5rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-card shadow-lg mx-1 sm:mx-4">
        <div className="flex items-start justify-between border-b border-border px-3 sm:px-4 py-3 gap-2">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm sm:text-base font-semibold text-foreground truncate">{title}</h2>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
          >
            <X className="size-4" />
          </button>
        </div>
        {children && <div className="p-3 sm:p-4">{children}</div>}
        {footer && <div className="border-t border-border px-3 sm:px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}
