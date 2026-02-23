export function normalizeSourceProductId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return trimmed;
  }

  const segments = trimmed.split(":").filter((segment) => segment.length > 0);
  if (segments.length === 0) {
    return trimmed;
  }

  return segments[segments.length - 1];
}

export function buildDraftItemId(
  draftListId: string,
  sourceProductId: string,
): string {
  return `${draftListId}:${normalizeSourceProductId(sourceProductId)}`;
}

export function buildActiveItemId(
  activeListId: string,
  sourceProductId: string,
): string {
  return `${activeListId}:${normalizeSourceProductId(sourceProductId)}`;
}
