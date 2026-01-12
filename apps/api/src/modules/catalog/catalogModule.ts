import { GetCategoryDetail } from "./application/getCategoryDetail";
import { GetRootCategories } from "./application/getRootCategories";
import type { CatalogCache } from "./domain/catalogCache";
import type { CatalogProvider } from "./domain/catalogProvider";
import { InMemoryCatalogCache } from "./infrastructure/InMemoryCatalogCache";
import { MercadonaCatalogProvider } from "./infrastructure/MercadonaCatalogProvider";
import { MercadonaHttpClient } from "./infrastructure/MercadonaHttpClient";
import { createCatalogRouter } from "./api/catalogRouter";

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
