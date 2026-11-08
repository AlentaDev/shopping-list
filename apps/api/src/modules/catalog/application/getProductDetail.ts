import { AppError } from "@src/shared/errors/appError.js";
import type { CatalogCache } from "../domain/catalogCache.js";
import type { CatalogProvider } from "../domain/catalogProvider.js";

const PRODUCT_DETAIL_TTL_MS = 6 * 60 * 60 * 1000;

type ProductDetail = {
  id: string;
  name: string;
  brand: string | null;
  origin: string | null;
  photos: string[];
  description: string | null;
  usageInstructions: string | null;
  storageInstructions: string | null;
  ingredients: string | null;
  allergens: string | null;
};

export class GetProductDetail {
  constructor(private readonly provider: CatalogProvider, private readonly cache: CatalogCache) {}

  async execute(id: string): Promise<ProductDetail> {
    const key = `${this.provider.metadata?.slug ?? "mercadona"}:products:${id}`;
    const cached = this.cache.get<ProductDetail>(key);
    if (cached) return cached;
    try {
      const product = await this.provider.getProduct(id);
      const result: ProductDetail = {
        id: String(product.id),
        name: product.display_name,
        brand: product.brand ?? null,
        origin: product.origin ?? null,
        photos: (product.photos ?? []).map((photo) => photo.regular ?? photo.thumbnail).filter((url): url is string => Boolean(url)),
        description: product.details?.description ?? null,
        usageInstructions: product.details?.usage_instructions ?? null,
        storageInstructions: product.details?.storage_instructions ?? null,
        ingredients: product.nutrition_information?.ingredients ?? null,
        allergens: product.nutrition_information?.allergens ?? null,
      };
      this.cache.set(key, result, PRODUCT_DETAIL_TTL_MS);
      return result;
    } catch {
      const stale = this.cache.getStale<ProductDetail>(key);
      if (stale) return stale;
      throw new AppError(502, "catalog_provider_unavailable", "Catalog provider unavailable");
    }
  }
}
