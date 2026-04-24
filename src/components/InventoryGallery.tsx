'use client';

import React from 'react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, Play, X, ZoomIn, ZoomOut } from 'lucide-react';

import type { ForkliftUnit } from '@/lib/marketing/schemaTransformers';
import { buildBlurDataUrl, buildGalleryMedia, inferMediaKind, type GalleryMediaItem } from '@/lib/marketing/mediaGallery';

const NextImageComponent = (Image as unknown as { default?: typeof Image }).default ?? Image;

type InventoryGalleryProps = {
  unit: ForkliftUnit;
  leadFormAnchorId?: string;
};

function isImageItem(item: GalleryMediaItem) {
  return item.kind === 'image';
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function InventoryGallery({
  unit,
  leadFormAnchorId = 'inventory-lead-capture',
}: InventoryGalleryProps) {
  const media = useMemo(() => buildGalleryMedia(unit), [unit]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [announcement, setAnnouncement] = useState('');
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [pinchDistance, setPinchDistance] = useState<number | null>(null);
  const liveRegionRef = useRef<HTMLParagraphElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const activeItem = media[activeIndex] ?? null;

  const goToIndex = useCallback(
    (index: number) => {
      const bounded = ((index % media.length) + media.length) % media.length;
      setActiveIndex(bounded);
      setZoom(1);
      setAnnouncement(`${inferMediaKind(media[bounded].originalPath) === 'video' ? 'Video' : 'Image'} ${bounded + 1} of ${media.length}`);
    },
    [media]
  );

  const goNext = useCallback(() => {
    if (media.length < 2) return;
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex, media.length]);

  const goPrevious = useCallback(() => {
    if (media.length < 2) return;
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex, media.length]);

  useEffect(() => {
    if (media.length > 0) {
      setAnnouncement(`${isImageItem(media[activeIndex]) ? 'Image' : 'Video'} ${activeIndex + 1} of ${media.length}`);
    }
  }, [activeIndex, media]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setLightboxOpen(false);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusables = Array.from(focusable).filter((node) => !node.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrevious, lightboxOpen]);

  useEffect(() => {
    if (lightboxOpen) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      window.setTimeout(() => dialogRef.current?.focus(), 0);
    } else if (lastFocusedRef.current) {
      lastFocusedRef.current.focus();
    }
  }, [lightboxOpen]);

  function openLightbox() {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setZoom(1);
  }

  function handleSwipeEnd(endX: number) {
    if (touchStartX == null) return;
    const deltaX = endX - touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
    setTouchStartX(null);
  }

  function handleWheelZoom(event: React.WheelEvent) {
    if (!lightboxOpen || !activeItem || !isImageItem(activeItem)) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    setZoom((current) => clamp(Number((current + delta).toFixed(2)), 1, 3));
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (!lightboxOpen || !activeItem || !isImageItem(activeItem)) return;
    if (event.touches.length !== 2) return;
    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    if (pinchDistance != null) {
      const delta = (distance - pinchDistance) / 180;
      setZoom((current) => clamp(Number((current + delta).toFixed(2)), 1, 3));
    }
    setPinchDistance(distance);
  }

  function handleTouchEnd() {
    setPinchDistance(null);
  }

  if (media.length === 0) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-6 text-center">
        <div className="mx-auto max-w-lg">
          <h2 className="text-lg font-semibold text-white">Photos coming soon</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Photos coming soon — contact David for a walkthrough and current visual details on this unit.
          </p>
          <a
            href={`#${leadFormAnchorId}`}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-[#E8B800] px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#F0C800]"
          >
            Ask David for a walkthrough
          </a>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <p
          ref={liveRegionRef}
          aria-live="polite"
          className="sr-only"
        >
          {announcement}
        </p>

        <div
          className="group relative overflow-hidden rounded-lg border border-white/10 bg-black/20"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault();
              goNext();
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault();
              goPrevious();
            } else if (event.key === 'Enter') {
              event.preventDefault();
              openLightbox();
            }
          }}
          onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0)}
        >
          <div className="relative aspect-[16/10]">
            {activeItem.kind === 'image' ? (
              <NextImageComponent
                src={activeItem.src}
                alt={activeItem.alt}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 70vw"
                placeholder="blur"
                blurDataURL={buildBlurDataUrl('Loading')}
              />
            ) : (
              <video
                src={activeItem.src}
                poster={activeItem.posterSrc ?? '/favicon.svg'}
                controls
                preload="metadata"
                className="h-full w-full object-cover"
                playsInline
                muted
              />
            )}
          </div>

          {media.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous media"
                onClick={goPrevious}
                className="absolute left-2 top-1/2 z-10 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white transition hover:bg-black/75 sm:flex"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next media"
                onClick={goNext}
                className="absolute right-2 top-1/2 z-10 hidden min-h-11 min-w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white transition hover:bg-black/75 sm:flex"
              >
                <ChevronRight size={18} />
              </button>
            </>
          ) : null}

          <button
            ref={openButtonRef}
            type="button"
            aria-label={activeItem.kind === 'video' ? 'Open video in fullscreen viewer' : 'Open image in fullscreen viewer'}
            onClick={openLightbox}
            className="absolute right-2 top-2 z-10 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white transition hover:bg-black/75"
          >
            <Expand size={18} />
          </button>

          {activeItem.kind === 'video' ? (
            <div className="pointer-events-none absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
              <Play size={12} />
              Video
            </div>
          ) : null}

          <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
            {activeIndex + 1} / {media.length}
          </div>
        </div>

        <p className="mt-3 text-sm leading-6 text-slate-300">{activeItem.alt}</p>

        {media.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {media.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => goToIndex(index)}
                className={`relative shrink-0 overflow-hidden rounded-lg border ${
                  index === activeIndex
                    ? 'border-[#E8B800] ring-2 ring-[#E8B800]/25'
                    : 'border-white/10'
                }`}
                aria-label={`Show ${item.kind} ${index + 1} of ${media.length}`}
              >
                <div className="relative h-20 w-20 sm:h-24 sm:w-24">
                  {item.kind === 'image' ? (
                    <NextImageComponent
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="96px"
                      loading={Math.abs(index - activeIndex) <= 1 ? 'eager' : 'lazy'}
                      placeholder="blur"
                      blurDataURL={buildBlurDataUrl('Thumb')}
                    />
                  ) : (
                    <>
                      <NextImageComponent
                        src={item.posterSrc ?? '/favicon.svg'}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="96px"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={buildBlurDataUrl('Video')}
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-white">
                        <Play size={20} />
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {lightboxOpen && activeItem ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 px-3 py-4 sm:px-6"
          onClick={closeLightbox}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Inventory media viewer"
            tabIndex={-1}
            className="relative flex h-full w-full max-w-6xl flex-col outline-none"
            onClick={(event) => event.stopPropagation()}
            onWheel={handleWheelZoom}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchStart={(event) => setTouchStartX(event.touches[0]?.clientX ?? null)}
          >
            <div className="flex items-center justify-between gap-3 pb-3">
              <p className="text-sm font-medium text-white">
                {activeIndex + 1} of {media.length}
              </p>
              <div className="flex items-center gap-2">
                {activeItem.kind === 'image' ? (
                  <>
                    <button
                      type="button"
                      aria-label="Zoom out"
                      onClick={() => setZoom((current) => clamp(Number((current - 0.2).toFixed(2)), 1, 3))}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
                    >
                      <ZoomOut size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Zoom in"
                      onClick={() => setZoom((current) => clamp(Number((current + 0.2).toFixed(2)), 1, 3))}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
                    >
                      <ZoomIn size={18} />
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  aria-label="Close lightbox"
                  onClick={closeLightbox}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div
              className="relative flex-1 overflow-hidden rounded-lg border border-white/10 bg-black/40"
              onTouchEnd={(event) => {
                handleTouchEnd();
                handleSwipeEnd(event.changedTouches[0]?.clientX ?? 0);
              }}
            >
              {activeItem.kind === 'image' ? (
                <div className="flex h-full w-full items-center justify-center overflow-auto">
                  <img
                    src={activeItem.src}
                    alt={activeItem.alt}
                    style={{
                      transform: `scale(${zoom})`,
                      transition: 'transform 220ms ease',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                    className="select-none object-contain"
                  />
                </div>
              ) : (
                <video
                  src={activeItem.src}
                  poster={activeItem.posterSrc ?? '/favicon.svg'}
                  controls
                  preload="metadata"
                  className="h-full w-full object-contain"
                  playsInline
                />
              )}

              {media.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Previous media"
                    onClick={goPrevious}
                    className="absolute left-2 top-1/2 inline-flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    aria-label="Next media"
                    onClick={goNext}
                    className="absolute right-2 top-1/2 inline-flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-black/55 text-white"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              ) : null}
            </div>

            <p className="pt-3 text-sm leading-6 text-slate-200">{activeItem.alt}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
