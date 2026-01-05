import { AppError } from "../../../shared/errors/appError";
import { ROOT_CATEGORIES_CACHE_KEY } from "./cacheKeys";
import { ROOT_CATEGORIES_TTL_MS } from "./cacheTtl";
import type { CatalogCache } from "../domain/catalogCache";
import type { CatalogProvider, MercadonaRootCategory } from "../domain/catalogProvider";
import type { CatalogCategoryNode, GetRootCategoriesResponse } from "../domain/catalogTypes";

export class GetRootCategories {
  constructor(
    private readonly provider: CatalogProvider,
    private readonly cache: CatalogCache,
  ) {}

  async execute(): Promise<GetRootCategoriesResponse> {
    const cached = this.cache.get<GetRootCategoriesResponse>(ROOT_CATEGORIES_CACHE_KEY);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.provider.getRootCategories();
      const mapped = mapRootCategories(response.results);
      const result = { categories: mapped } satisfies GetRootCategoriesResponse;

      this.cache.set(ROOT_CATEGORIES_CACHE_KEY, result, ROOT_CATEGORIES_TTL_MS);
      return result;
    } catch (error) {
      const stale = this.cache.getStale<GetRootCategoriesResponse>(ROOT_CATEGORIES_CACHE_KEY);
      if (stale) {
        return stale;
      }

      throw new AppError(502, "catalog_provider_unavailable", "Catalog provider unavailable");
    }
  }
}

function mapRootCategories(results: MercadonaRootCategory[]): CatalogCategoryNode[] {
  const nodes: CatalogCategoryNode[] = [];

  for (const root of results) {
    nodes.push({
      id: String(root.id),
      name: root.name,
      order: root.order,
      level: 0,
    });

    for (const child of root.categories) {
      nodes.push({
        id: String(child.id),
        name: child.name,
        order: child.order,
        level: 1,
        parentId: String(root.id),
        published: child.published,
      });
    }
  }

  return nodes;
}
