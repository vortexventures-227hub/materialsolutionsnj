type ClassificationBearing = {
  unit_type?: string | null;
};

function normalizeClassification(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

export function isPersistedCanonicalFreshForInventory(
  persisted: ClassificationBearing,
  currentInventory: ClassificationBearing
): boolean {
  return normalizeClassification(persisted.unit_type) === normalizeClassification(currentInventory.unit_type);
}
