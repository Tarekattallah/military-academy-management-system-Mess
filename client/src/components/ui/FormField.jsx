
import { Label } from './Input';









export function FormField({ label, required, description, error, children }) {
  return (
    <div className="flex flex-col gap-2">
      {label &&
      <Label>
          {label}
          {required && <span className="mr-1 text-destructive">*</span>}
        </Label>
      }
      {children}
      {description && !error &&
      <p className="text-xs text-muted-foreground">{description}</p>
      }
      {error &&
      <p className="text-xs font-medium text-destructive">{error}</p>
      }
    </div>);

}