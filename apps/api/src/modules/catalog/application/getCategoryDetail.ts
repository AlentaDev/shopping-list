import { AppError } from "@src/shared/errors/appError.js";
import { categoryDetailCacheKey } from "./cacheKeys.js";
import { CATEGORY_DETAIL_TTL_MS } from "./cacheTtl.js";
import type { CatalogCache } from "../domain/catalogCache.js";
import type {
  CatalogProvider,
  MercadonaCategoryDetailResponse,
  MercadonaCategoryProduct,
} from "../domain/catalogProvider.js";
import type {
  CatalogProductSummary,
  GetCategoryDetailResponse,
} from "../domain/catalogTypes.js";

export class GetCategoryDetail {
  constructor(
    private readonly provider: CatalogProvider,
    private readonly cache: CatalogCache
  ) {}

  async execute(id: string): Promise<GetCategoryDetailResponse> {
    const cacheKey = categoryDetailCacheKey(id);
    const cached = this.cache.get<GetCategoryDetailResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await this.provider.getCategoryDetail(id);
      const mapped = mapCategoryDetail(response);

      this.cache.set(cacheKey, mapped, CATEGORY_DETAIL_TTL_MS);
      return mapped;
    } catch (_error) {
      const stale = this.cache.getStale<GetCategoryDetailResponse>(cacheKey);
      if (stale) {
        return stale;
      }

      throw new AppError(
        502,
        "catalog_provider_unavailable",
        "Catalog provider unavailable"
      );
    }
  }
}

function mapCategoryDetail(
  response: MercadonaCategoryDetailResponse
): GetCategoryDetailResponse {
  return {
    id: String(response.id),
    name: response.name,
    subcategories: response.categories.map((category) => ({
      id: String(category.id),
      name: category.name,
      products: category.products.map(mapProduct),
    })),
  };
}

function mapProduct(product: MercadonaCategoryProduct): CatalogProductSummary {
  const priceInstructions = product.price_instructions;
  const unitPrice = Number(priceInstructions.unit_price);
  const bulkPrice = Number(priceInstructions.bulk_price);
  const price = product.packaging === "Granel" ? bulkPrice : unitPrice;

  return {
    id: String(product.id),
    name: product.display_name,
    thumbnail: product.thumbnail ?? null,
    packaging: product.packaging ?? null,
    price,
    unitSize: priceInstructions.unit_size ?? null,
    unitFormat: priceInstructions.size_format ?? null,
    unitPrice: bulkPrice,
    isApproxSize: Boolean(priceInstructions.approx_size),
  };
}
