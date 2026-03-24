'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react';

interface PhotoGalleryProps {
  images: string[];
  title: string;
}

export default function PhotoGallery({ images, title }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center">
        <span className="text-6xl">🏗️</span>
      </div>
    );
  }

  return (
    <>
      {/* Main Gallery */}
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden group">
          <Image
            src={images[selectedIndex]}
            alt={`${title} - Image ${selectedIndex + 1}`}
            fill
            className="object-cover"
            priority
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Zoom Button */}
          <button
            onClick={() => setIsLightboxOpen(true)}
            className="absolute bottom-4 right-4 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
            aria-label="View fullscreen"
          >
            <ZoomIn size={20} />
          </button>

          {/* Image Counter */}
          <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Strip */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-orange-600 ring-2 ring-orange-200'
                    : 'border-transparent hover:border-gray-300'
                }`}
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
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full z-10"
              aria-label="Close lightbox"
            >
              <X size={28} />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); goToNext(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white hover:bg-white/10 rounded-full z-10"
                  aria-label="Next image"
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative w-full h-full max-w-6xl max-h-[90vh] m-4" onClick={(e) => e.stopPropagation()}>
              <Image
                src={images[selectedIndex]}
                alt={`${title} - Image ${selectedIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>

            {/* Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 text-white text-sm rounded-full">
              {selectedIndex + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
