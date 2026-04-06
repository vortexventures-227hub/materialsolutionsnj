'use client';

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DavidAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  showOnlineDot?: boolean;
  showGlow?: boolean;
  className?: string;
}

export function DavidAvatar({
  size = 'md',
  showOnlineDot = false,
  showGlow = false,
  className,
}: DavidAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-2.5 h-2.5 bottom-0.5 right-0.5',
    lg: 'w-3 h-3 bottom-1 right-1',
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      {/* Glow ring */}
      {showGlow && (
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-pulse',
            sizeClasses[size]
          )}
          style={{
            background: 'radial-gradient(circle, rgba(232, 184, 0, 0.3), transparent)',
          }}
        />
      )}

      {/* Avatar circle */}
      <div
        className={cn(
          'relative flex items-center justify-center rounded-full border-2 border-accent-primary bg-gradient-to-br from-accent-primary to-amber-600 text-bg-primary font-bold',
          sizeClasses[size]
        )}
      >
        {/* Logo: Letter D or Bot icon */}
        {size === 'lg' ? (
          <span className="text-xl font-black">D</span>
        ) : (
          <Bot size={iconSizes[size]} />
        )}
      </div>

      {/* Online dot */}
      {showOnlineDot && (
        <div
          className={cn(
            'absolute rounded-full bg-green-400 border border-bg-primary',
            dotSizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
