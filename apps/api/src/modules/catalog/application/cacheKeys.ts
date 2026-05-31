export const ROOT_CATEGORIES_CACHE_KEY = "mercadona:categories:root";

export function rootCategoriesCacheKey(provider: string): string {
  return `${provider}:categories:root`;
}

export function categoryDetailCacheKey(provider: string, id: string): string {
  return `${provider}:categories:${id}`;
}
