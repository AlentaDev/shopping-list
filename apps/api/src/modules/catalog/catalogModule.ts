import { GetCategoryDetail } from "./application/getCategoryDetail.js";
import { GetRootCategories } from "./application/getRootCategories.js";
import type { CatalogCache } from "./domain/catalogCache.js";
import type { CatalogProvider } from "./domain/catalogProvider.js";
import { InMemoryCatalogCache } from "./infrastructure/InMemoryCatalogCache.js";
import { MercadonaCatalogProvider } from "./infrastructure/MercadonaCatalogProvider.js";
import { MercadonaHttpClient } from "./infrastructure/MercadonaHttpClient.js";
import { createCatalogRouter } from "./api/catalogRouter.js";

const MERCADONA_BASE_URL = "https://tienda.mercadona.es/api";
const MERCADONA_TIMEOUT_MS = 8000;

type CatalogModuleDependencies = {
  provider?: CatalogProvider;
  cache?: CatalogCache;
};

export function createCatalogModule(deps: CatalogModuleDependencies = {}) {
  const cache = deps.cache ?? new InMemoryCatalogCache();
  const provider =
    deps.provider ??
    new MercadonaCatalogProvider(
      new MercadonaHttpClient(MERCADONA_BASE_URL, MERCADONA_TIMEOUT_MS),
    );

  const getRootCategories = new GetRootCategories(provider, cache);
  const getCategoryDetail = new GetCategoryDetail(provider, cache);

  const router = createCatalogRouter({
    getRootCategories,
    getCategoryDetail,
  });

  return { router, provider };
}
