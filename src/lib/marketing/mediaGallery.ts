import { toAltText, type ForkliftUnit } from './schemaTransformers';

export type GalleryMediaKind = 'image' | 'video';

export interface GalleryMediaItem {
  id: string;
  kind: GalleryMediaKind;
  src: string;
  alt: string;
  posterSrc: string | null;
  originalPath: string;
}

const GENERIC_VIDEO_POSTER = '/favicon.svg';

export function inferMediaKind(mediaPath: string): GalleryMediaKind {
  const lower = mediaPath.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.mov') || lower.endsWith('.webm')) {
    return 'video';
  }

  return 'image';
}

function encodeMediaPath(mediaPath: string) {
  return encodeURIComponent(mediaPath);
}

export function toMediaApiSrc(mediaPath: string) {
  return `/api/media?path=${encodeMediaPath(mediaPath)}`;
}

function fileNameStem(mediaPath: string) {
  const fileName = mediaPath.split('/').pop() ?? mediaPath;
  const dotIndex = fileName.lastIndexOf('.');
  return (dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName).toLowerCase();
}

function findPosterSource(mediaPath: string, unit: ForkliftUnit): string | null {
  const normalizedPaths = unit.media_paths ?? [];
  const mediaStem = fileNameStem(mediaPath);

  const screenshot = normalizedPaths.find((candidate) => {
    const lower = candidate.toLowerCase();
    return inferMediaKind(candidate) === 'image' && lower.includes('video_screenshot');
  });
  if (screenshot) return screenshot;

  const matchingStill = normalizedPaths.find((candidate) => {
    if (inferMediaKind(candidate) !== 'image') return false;
    const stem = fileNameStem(candidate);
    return stem.includes(mediaStem) || mediaStem.includes(stem);
  });
  if (matchingStill) return matchingStill;

  const firstImage = normalizedPaths.find((candidate) => inferMediaKind(candidate) === 'image');
  return firstImage ?? null;
}

export function buildGalleryMedia(unit: ForkliftUnit): GalleryMediaItem[] {
  return (unit.media_paths ?? []).map((mediaPath, index) => {
    const kind = inferMediaKind(mediaPath);
    const posterPath = kind === 'video' ? findPosterSource(mediaPath, unit) : null;

    return {
      id: `${unit.unit_id}-${index}`,
      kind,
      src: toMediaApiSrc(mediaPath),
      alt: toAltText(mediaPath, unit),
      posterSrc: posterPath ? toMediaApiSrc(posterPath) : kind === 'video' ? GENERIC_VIDEO_POSTER : null,
      originalPath: mediaPath,
    };
  });
}

export function buildBlurDataUrl(label: string) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
      <rect width="16" height="9" fill="#111827"/>
      <rect x="0" y="0" width="16" height="9" fill="url(#g)" opacity="0.65"/>
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop stop-color="#111827" offset="0%"/>
          <stop stop-color="#1f2937" offset="50%"/>
          <stop stop-color="#111827" offset="100%"/>
        </linearGradient>
      </defs>
      <text x="8" y="5.1" fill="#e5e7eb" font-size="1.15" text-anchor="middle" font-family="Arial, sans-serif">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}
