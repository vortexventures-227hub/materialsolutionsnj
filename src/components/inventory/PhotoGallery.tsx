'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn, Camera } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PhotoGalleryProps {
  images: string[];
  title: string;
}

export default function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goToPrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  }, [images.length]);

  // Empty state with premium placeholder
  if (!images || images.length === 0) {
    return (
      <div className="space-y-3">
        <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary-100 via-secondary-50 to-primary-50 rounded-2xl overflow-hidden border border-secondary-200/60 shadow-premium flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white/80 shadow-sm flex items-center justify-center">
            <Camera size={36} className="text-secondary-300" />
          </div>
          <div className="text-center">
            <p className="text-secondary-400 font-medium text-sm">Photos coming soon</p>
            <p className="text-secondary-300 text-xs mt-1">Contact us for current images</p>
          </div>
        </div>
        {/* Placeholder thumbnails */}
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-20 h-20 rounded-xl bg-secondary-100/60 border border-secondary-200/40 flex-shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-3">
        {/* Main Image */}
        <div className="relative aspect-[4/3] bg-secondary-100 rounded-2xl overflow-hidden group border border-secondary-200/60 shadow-premium">
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
                src={images[selectedIndex]}
                alt={`${title} - Image ${selectedIndex + 1}`}
                fill
                className="object-cover"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradient overlays for controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm text-secondary-700 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105"
                aria-label="Previous image"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 bg-white/90 backdrop-blur-sm text-secondary-700 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105"
                aria-label="Next image"
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}

          {/* Zoom Button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute top-3 right-3 p-2.5 bg-white/90 backdrop-blur-sm text-secondary-700 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-white hover:shadow-lg hover:scale-105"
            aria-label="View fullscreen"
          >
            <ZoomIn size={18} />
          </button>

          {/* Image Counter */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-secondary-700 text-xs font-medium rounded-full shadow-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  'relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200',
                  index === selectedIndex
                    ? 'border-primary-500 ring-2 ring-primary-200 shadow-md scale-[1.02]'
                    : 'border-secondary-200/60 hover:border-secondary-300 opacity-70 hover:opacity-100'
                )}
              >
                <Image
                  src={image}
                  alt={`${title} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                />
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
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl z-10 transition-all duration-200"
              aria-label="Close lightbox"
            >
              <X size={24} />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl z-10 transition-all duration-200"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-xl z-10 transition-all duration-200"
                  aria-label="Next image"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={selectedIndex}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-full h-full max-w-6xl max-h-[90vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[selectedIndex]}
                alt={`${title} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </motion.div>

            {/* Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
