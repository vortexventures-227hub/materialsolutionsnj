'use client';

import { useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import type { SimliStatus } from '@/lib/david/simli';

interface DavidVideoProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  status: SimliStatus;
  className?: string;
}

const statusLabels: Record<SimliStatus, string> = {
  idle: 'Offline',
  connecting: 'Connecting...',
  connected: 'Listening',
  speaking: 'Speaking',
  silent: 'Listening',
  error: 'Connection error',
  disconnected: 'Disconnected',
};

export function DavidVideo({ videoRef, audioRef, status, className }: DavidVideoProps) {
  const isActive = status === 'connected' || status === 'speaking' || status === 'silent';
  const isConnecting = status === 'connecting';

  // Callback refs to bridge RefObject to element assignment
  const setVideoRef = useCallback(
    (el: HTMLVideoElement | null) => {
      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el;
    },
    [videoRef]
  );

  const setAudioRef = useCallback(
    (el: HTMLAudioElement | null) => {
      (audioRef as React.MutableRefObject<HTMLAudioElement | null>).current = el;
    },
    [audioRef]
  );

  return (
    <div
      className={cn(
        'relative w-full aspect-[3/4] bg-secondary-900 rounded-2xl overflow-hidden',
        className
      )}
    >
      {/* Video stream from Simli */}
      <video
        ref={setVideoRef}
        autoPlay
        playsInline
        muted={false}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-500',
          isActive ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Hidden audio element for Simli audio playback */}
      <audio ref={setAudioRef} autoPlay />

      {/* Idle/connecting placeholder */}
      {!isActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div
            className={cn(
              'w-24 h-24 rounded-full bg-secondary-700 flex items-center justify-center',
              isConnecting && 'animate-pulse'
            )}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-secondary-400"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">David</p>
            <p className="text-secondary-400 text-xs">Equipment Specialist</p>
          </div>
        </div>
      )}

      {/* Speaking indicator */}
      {status === 'speaking' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="w-1 bg-primary-400 rounded-full animate-pulse"
              style={{
                height: `${8 + Math.random() * 12}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: '0.6s',
              }}
            />
          ))}
        </div>
      )}

      {/* Status badge */}
      <div className="absolute top-3 left-3">
        <div
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium backdrop-blur-sm',
            isActive
              ? 'bg-green-500/20 text-green-300'
              : status === 'error'
              ? 'bg-red-500/20 text-red-300'
              : 'bg-secondary-700/60 text-secondary-300'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isActive
                ? 'bg-green-400'
                : status === 'error'
                ? 'bg-red-400'
                : 'bg-secondary-500'
            )}
          />
          {statusLabels[status]}
        </div>
      </div>
    </div>
  );
}
