import React from 'react';

export function LogoLoader({ className = '', size = 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };
  
  const imgSize = sizeClasses[size] || sizeClasses.lg;

  return (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="relative">
        <img 
          src="/logo-shield.png" 
          alt="Loading..." 
          className={`${imgSize} animate-pulse object-contain drop-shadow-md`}
        />
        <div className="absolute inset-0 animate-ping rounded-full border-2 border-primary/40 opacity-20" style={{ animationDuration: '2s' }}></div>
      </div>
      {size !== 'sm' && (
        <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground animate-pulse" style={{ animationDuration: '1.5s' }}>
          جاري التحميل...
        </p>
      )}
    </div>
  );
}
