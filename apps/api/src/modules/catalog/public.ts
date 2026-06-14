export type {
  CatalogProvider,
  CatalogProviderSlug,
  MercadonaProductDetail,
  MercadonaCategoryDetailResponse,
  MercadonaRootCategoriesResponse,
} from "./domain/catalogProvider.js";

export interface CatalogProviderResolver {
  resolve(slug: string): import("./domain/catalogProvider.js").CatalogProvider;
}
