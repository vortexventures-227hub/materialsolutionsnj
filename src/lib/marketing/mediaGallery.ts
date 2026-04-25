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
  if (mediaPath.startsWith('/') || /^https?:\/\//.test(mediaPath)) {
    return mediaPath;
  }
  return `/api/media?path=${encodeMediaPath(mediaPath)}`;
}

function fileNameStem(mediaPath: string) {
  const fileName = mediaPath.split('/').pop() ?? mediaPath;
  const dotIndex = fileName.lastIndexOf('.');
  return (dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName).toLowerCase();
}

function isDisallowedInventoryStill(mediaPath: string) {
  const lower = (mediaPath.split('/').pop() ?? mediaPath).toLowerCase();
  return lower.includes('screenshot')
    || lower.includes('video_still')
    || lower.includes('frame_grab')
    || /^md_orderpicker_lot_photo_\d+\.jpe?g$/.test(lower)
    || /^raymond_752r45tt_2018_reachtruck_photo_\d+\.jpe?g$/.test(lower)
    || /^raymond_970csr30t_reachtruck_photo_\d+\.jpe?g$/.test(lower);
}

function findPosterSource(mediaPath: string, unit: ForkliftUnit): string | null {
  const normalizedPaths = (unit.media_paths ?? []).filter((candidate) => !isDisallowedInventoryStill(candidate));
  const mediaStem = fileNameStem(mediaPath);

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
  return (unit.media_paths ?? []).filter((mediaPath) => !isDisallowedInventoryStill(mediaPath)).map((mediaPath, index) => {
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
