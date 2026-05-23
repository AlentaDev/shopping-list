const LAST_CATEGORY_STORAGE_KEY = "catalog.lastCategoryByUserProvider";

type LastCategoryState = Record<string, string>;

const buildKey = (userId: string, providerId: string) => `${userId}:${providerId}`;

const readState = (): LastCategoryState => {
  try {
    const raw = window.localStorage.getItem(LAST_CATEGORY_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as LastCategoryState;
  } catch {
    return {};
  }
};

const writeState = (next: LastCategoryState): void => {
  try {
    window.localStorage.setItem(LAST_CATEGORY_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // noop
  }
};

export const saveLastCategory = (
  userId: string,
  providerId: string,
  categoryId: string,
): void => {
  const current = readState();
  current[buildKey(userId, providerId)] = categoryId;
  writeState(current);
};

export const getLastCategory = (
  userId: string,
  providerId: string,
): string | null => {
  const current = readState();
  return current[buildKey(userId, providerId)] ?? null;
};
