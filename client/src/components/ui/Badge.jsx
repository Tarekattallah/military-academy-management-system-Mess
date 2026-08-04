import { cva } from 'class-variance-authority';


const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "text-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        success: "border-transparent bg-success text-success-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);





export function Badge({ variant, className = '', ...rest }) {
  return (
    <span className={badgeVariants({ variant, className })} {...rest} />);

}