import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-lg border border-border bg-card shadow-sm ${className}`}
      {...rest}
    />
  );
}

export function CardHeader({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col gap-1 p-4 ${className}`} {...rest} />;
}

export function CardTitle({ className = '', ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm font-medium text-muted-foreground ${className}`} {...rest} />
  );
}

export function CardContent({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`p-4 pt-0 ${className}`} {...rest} />;
}

export function CardFooter({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex items-center p-4 pt-0 ${className}`} {...rest} />;
}

type TagTone = 'neutral' | 'olive' | 'rust' | 'brick';

const toneClasses: Record<TagTone, string> = {
  neutral: 'border-border text-muted-foreground',
  olive: 'border-primary text-primary',
  rust: 'border-warning text-warning-foreground',
  brick: 'border-destructive text-destructive',
};

export function Tag({
  tone = 'neutral',
  children,
}: {
  tone?: TagTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`font-mono inline-block rounded-sm border px-1.5 py-0.5 text-[11px] font-medium uppercase leading-none ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
