import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center text-stone-500 dark:text-stone-400 gap-3 ${className}`}
    >
      <Loader2 className={`${sizes[size]} animate-spin text-emerald-700 dark:text-emerald-400`} />
      {text && <p className="text-sm font-medium animate-pulse">{text}</p>}
    </div>
  );
}
