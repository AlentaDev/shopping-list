import type { ListItem } from "./types";

const canonicalSourceProductId = (item: ListItem): string => {
  const sourceProductId = item.sourceProductId?.trim();

  if (sourceProductId) {
    return sourceProductId;
  }

  const [, productId] = item.id.split(":");

  return productId?.trim() || item.id;
};

const isTechnicalServerId = (id: string): boolean => id.includes(":");

const resolvePreferredTechnicalId = (
  current: string,
  incoming: string,
): string => {
  if (!current) {
    return incoming;
  }

  if (isTechnicalServerId(current)) {
    return current;
  }

  if (isTechnicalServerId(incoming)) {
    return incoming;
  }

  return current;
};

export const mapCheckedItemsToTechnicalIds = (items: ListItem[]): string[] => {
  const technicalByCanonicalId = new Map<string, string>();

  for (const item of items) {
    if (!item.checked) {
      continue;
    }

    const canonicalId = canonicalSourceProductId(item);
    const nextTechnicalId = resolvePreferredTechnicalId(
      technicalByCanonicalId.get(canonicalId) ?? "",
      item.id,
    );

    technicalByCanonicalId.set(canonicalId, nextTechnicalId);
  }

  return Array.from(technicalByCanonicalId.values());
};
