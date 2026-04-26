'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, RotateCcw, Volume2, VolumeX } from 'lucide-react';

import { useChatStore } from '@/stores/chatStore';

/**
 * DavidHero - Pre-recorded video of David for the homepage hero section.
 * Loops silently to convey "David is live in the warehouse."
 * The floating DavidChatWidget handles actual conversation on all pages.
 */
export default function DavidHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const openChat = useChatStore((state) => state.openChat);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // Attempt autoplay; browsers require muted for autoplay to work
    video.play().catch(() => {
      // Autoplay blocked — video stays paused, poster image shows
    });
  }, []);

  const handleOpenChat = () => {
    openChat();
  };

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0">
      {/* Outer container — square (640×640 native) displayed as portrait crop */}
      <div className="relative rounded-3xl overflow-hidden max-h-[40vh] lg:max-h-none" style={{ aspectRatio: '3/4' }}>
        {/* Dark warehouse atmosphere base */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 70% at 50% 45%, #0d1a2a 0%, #08111a 40%, #000000 75%)',
          }}
        />

        {/* Pre-recorded David video */}
        <video
          ref={videoRef}
          src="/videos/david_intro.mp4"
          autoPlay
          loop
          muted={isMuted}
          playsInline
          onCanPlay={() => setVideoReady(true)}
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 0.6s ease',
          }}
        />

        {/* Edge vignette — fades video into pure black on all edges */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: [
              'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 18%, transparent 70%, rgba(0,0,0,0.85) 100%)',
              'linear-gradient(to right,  rgba(0,0,0,0.5) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.5) 100%)',
            ].join(', '),
          }}
        />

        {/* Video controls — top-right */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <button
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;

              video.currentTime = 0;
              void video.play().catch(() => {});
            }}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Replay video"
            title="Replay video"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => {
              const video = videoRef.current;
              const nextMuted = !isMuted;

              if (video) {
                video.muted = nextMuted;
                if (!nextMuted) {
                  video.currentTime = 0;
                }
                void video.play().catch(() => {});
              }

              setIsMuted(nextMuted);
            }}
            className="bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full p-2 text-white/80 hover:text-white transition-colors"
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            title={isMuted ? 'Unmute video' : 'Mute video'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>

        {/* Online indicator — top-left */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 z-10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="text-xs text-white/80 font-medium">Online</span>
        </div>

        {/* Bottom overlay — name + CTA */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-6 pt-10 bg-gradient-to-t from-black via-black/70 to-transparent z-10">
          <p className="text-white/60 text-xs font-medium tracking-wider uppercase mb-1">
            Equipment Guide
          </p>
          <h3 className="text-white text-xl font-semibold mb-4">David</h3>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenChat}
            className="w-full flex items-center justify-center gap-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-3 px-5 rounded-2xl transition-colors shadow-glow-yellow"
          >
            <MessageCircle size={18} />
            Chat with David
          </motion.button>
        </div>
      </div>

      {/* Sub-caption */}
      <p className="mt-3 text-center text-xs text-white/35">
        Ask about inventory, pricing, or availability
      </p>
    </div>
  );
}
