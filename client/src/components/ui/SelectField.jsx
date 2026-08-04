import { Controller } from 'react-hook-form';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';












export function SelectField({
  control,
  name,
  label,
  placeholder = 'اختر...',
  options,
  required,
  error,
  className
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {label &&
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="mr-1 text-destructive">*</span>}
        </label>
      }
      <Controller
        control={control}
        name={name}
        render={({ field }) =>
        <SelectPrimitive.Root value={field.value} onValueChange={field.onChange}>
            <SelectPrimitive.Trigger
            className={cn(
              'flex h-9 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive'
            )}>
            
              <SelectPrimitive.Value placeholder={placeholder} />
              <SelectPrimitive.Icon asChild>
                <ChevronDown className="size-4 shrink-0 opacity-50" />
              </SelectPrimitive.Icon>
            </SelectPrimitive.Trigger>
            <SelectPrimitive.Portal>
              <SelectPrimitive.Content
              className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-card text-foreground shadow-md"
              position="popper">
              
                <SelectPrimitive.Viewport className="p-1">
                  {options.map((opt) =>
                <SelectPrimitive.Item
                  key={opt.value}
                  value={opt.value}
                  className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-secondary focus:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50">
                  
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        <SelectPrimitive.ItemIndicator>
                          <Check className="size-4" />
                        </SelectPrimitive.ItemIndicator>
                      </span>
                      <SelectPrimitive.ItemText>{opt.label}</SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                )}
                </SelectPrimitive.Viewport>
              </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
          </SelectPrimitive.Root>
        } />
      
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>);

}