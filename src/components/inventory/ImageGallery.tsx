'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Camera, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { type ListingImage } from '@/lib/types';

interface ImageGalleryProps {
  images: ListingImage[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? sortedImages.length - 1 : prev - 1));
  }, [sortedImages.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === sortedImages.length - 1 ? 0 : prev + 1));
  }, [sortedImages.length]);

  if (!images || images.length === 0) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[16/9] bg-gradient-to-br from-bg-secondary to-bg-tertiary rounded-2xl overflow-hidden border border-white/[0.06] flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.04] flex items-center justify-center">
            <Camera size={36} className="text-text-tertiary" />
          </div>
          <div className="text-center">
            <p className="text-text-secondary font-medium text-sm">Photos coming soon</p>
            <p className="text-text-tertiary text-xs mt-1">Contact us for current images</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {/* Main Image */}
        <div className="relative aspect-[16/9] bg-bg-tertiary rounded-2xl overflow-hidden group border border-white/[0.06]">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0"
            >
              <Image
                src={sortedImages[selectedIndex].url}
                alt={`${title} - Image ${selectedIndex + 1}`}
                fill
                className="object-cover brightness-[0.95] contrast-[1.05]"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Current Listing Photos Badge */}
          <div className="absolute top-4 left-4 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-ai/80 backdrop-blur-md text-white text-xs font-semibold">
              <Sparkles size={12} />
              Listing Photos
            </span>
          </div>

          {/* Navigation */}
          {sortedImages.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-bg-primary/60 backdrop-blur-sm text-text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-bg-primary/80"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-bg-primary/60 backdrop-blur-sm text-text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-bg-primary/80"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Zoom */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-4 right-4 p-2.5 bg-bg-primary/60 backdrop-blur-sm text-text-primary rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-bg-primary/80"
            aria-label="View fullscreen"
          >
            <ZoomIn size={18} />
          </button>

          {/* Counter */}
          {sortedImages.length > 1 && (
            <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-bg-primary/60 backdrop-blur-sm text-text-secondary text-xs font-medium rounded-full">
              {selectedIndex + 1} / {sortedImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {sortedImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {sortedImages.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200',
                  index === selectedIndex
                    ? 'border-accent-primary ring-2 ring-accent-primary/20'
                    : 'border-white/[0.06] hover:border-white/[0.15] opacity-60 hover:opacity-100'
                )}
              >
                <Image src={image.url} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {isLightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-bg-primary/95 backdrop-blur-md flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-3 text-text-secondary hover:text-text-primary hover:bg-white/[0.06] rounded-xl z-10 transition-all"
              aria-label="Close lightbox"
            >
              <X size={24} />
            </button>

            {sortedImages.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-text-secondary hover:text-text-primary hover:bg-white/[0.06] rounded-xl z-10 transition-all"
                  aria-label="Previous"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-text-secondary hover:text-text-primary hover:bg-white/[0.06] rounded-xl z-10 transition-all"
                  aria-label="Next"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            <motion.div
              key={selectedIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full h-full max-w-6xl max-h-[90vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={sortedImages[selectedIndex].url}
                alt={`${title} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </motion.div>

            {sortedImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/[0.06] backdrop-blur-sm text-text-secondary text-sm font-medium rounded-full">
                {selectedIndex + 1} / {sortedImages.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
