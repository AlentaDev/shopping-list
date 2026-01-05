export const ROOT_CATEGORIES_CACHE_KEY = "mercadona:categories:root";

export function categoryDetailCacheKey(id: string): string {
  return `mercadona:categories:${id}`;
}
