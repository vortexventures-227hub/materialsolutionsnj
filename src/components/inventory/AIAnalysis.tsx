'use client';

import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, Clock } from 'lucide-react';
import { type Listing } from '@/lib/types';

interface AIAnalysisProps {
  listing: Listing;
}

export default function AIAnalysis({ listing }: AIAnalysisProps) {
  if (!listing.ai_description && (!listing.ai_highlights || listing.ai_highlights.length === 0)) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="relative bg-bg-secondary rounded-2xl border border-accent-ai/20 overflow-hidden"
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent-primary/5 via-accent-ai/10 to-accent-primary/5 opacity-50" />

      <div className="relative p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-accent-ai/10 flex items-center justify-center">
            <Sparkles size={20} className="text-accent-ai" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">AI Equipment Analysis</h3>
            <p className="text-xs text-text-tertiary">Powered by computer vision & machine learning</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-ai/10 text-accent-ai text-xs font-semibold border border-accent-ai/20">
            <Sparkles size={10} />
            AI-Verified
          </span>
        </div>

        {/* Description */}
        {listing.ai_description && (
          <div className="text-text-secondary text-sm leading-relaxed mb-6 whitespace-pre-line">
            {listing.ai_description}
          </div>
        )}

        {/* Highlights */}
        {listing.ai_highlights && listing.ai_highlights.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-text-primary">Key Highlights</h4>
            <ul className="grid sm:grid-cols-2 gap-2.5">
              {listing.ai_highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <CheckCircle size={16} className="text-accent-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-text-secondary">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Timestamp */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/[0.06]">
          <Clock size={12} className="text-text-tertiary" />
          <span className="text-xs text-text-tertiary">
            Analyzed {new Date(listing.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
