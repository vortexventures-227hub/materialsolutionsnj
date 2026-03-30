'use client';

import { cn } from '@/lib/utils/cn';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-50 text-primary-700 ring-primary-200',
  secondary: 'bg-secondary-50 text-secondary-700 ring-secondary-200',
  success: 'bg-success-50 text-success-600 ring-green-200',
  warning: 'bg-warning-50 text-warning-600 ring-yellow-200',
  error: 'bg-error-50 text-error-600 ring-red-200',
  outline: 'bg-transparent text-secondary-600 ring-secondary-200',
};

export function Badge({ variant = 'secondary', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-success-500',
          variant === 'primary' && 'bg-primary-500',
          variant === 'warning' && 'bg-warning-500',
          variant === 'error' && 'bg-error-500',
          (variant === 'secondary' || variant === 'outline') && 'bg-secondary-400',
        )} />
      )}
      {children}
    </span>
  );
}
