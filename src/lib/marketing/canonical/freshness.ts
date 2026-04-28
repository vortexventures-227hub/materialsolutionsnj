import { PUBLIC_PHONE_LABEL } from '@/lib/contactDetails';

type ClassificationBearing = {
  unit_type?: string | null;
  contact_phone_public?: string | null;
  images?: Array<{ source_path?: string | null }> | null;
  media_paths?: string[] | null;
};

function normalizeClassification(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function normalizeMediaPath(value: string | null | undefined): string {
  return (value ?? '').trim();
}

function isImagePath(value: string): boolean {
  return /\.(jpe?g|png|webp|gif|svg)$/i.test(value);
}

function arraysMatch(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
}

export function isPersistedCanonicalFreshForInventory(
  persisted: ClassificationBearing,
  currentInventory: ClassificationBearing
): boolean {
  if (normalizeClassification(persisted.unit_type) !== normalizeClassification(currentInventory.unit_type)) {
    return false;
  }

  if (
    persisted.contact_phone_public &&
    persisted.contact_phone_public.trim() !== PUBLIC_PHONE_LABEL
  ) {
    return false;
  }

  const persistedImagePaths = (persisted.images ?? [])
    .map((image) => normalizeMediaPath(image.source_path))
    .filter(Boolean)
    .filter(isImagePath);
  const currentImagePaths = (currentInventory.media_paths ?? [])
    .map(normalizeMediaPath)
    .filter(Boolean)
    .filter(isImagePath);

  if (persistedImagePaths.length > 0 && currentImagePaths.length > 0) {
    return arraysMatch(persistedImagePaths, currentImagePaths);
  }

  return true;
}
