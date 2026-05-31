import { GetCategoryDetail } from "./application/getCategoryDetail.js";
import { GetRootCategories } from "./application/getRootCategories.js";
import { ProviderStrategyResolver } from "./application/ProviderStrategyResolver.js";
import type { CatalogCache } from "./domain/catalogCache.js";
import type { CatalogProvider } from "./domain/catalogProvider.js";
import { InMemoryCatalogCache } from "./infrastructure/InMemoryCatalogCache.js";
import { BonpreuCatalogProvider } from "./infrastructure/BonpreuCatalogProvider.js";
import { BonpreuHttpClient } from "./infrastructure/BonpreuHttpClient.js";
import { MercadonaCatalogProvider } from "./infrastructure/MercadonaCatalogProvider.js";
import { MercadonaHttpClient } from "./infrastructure/MercadonaHttpClient.js";
import { createCatalogRouter } from "./api/catalogRouter.js";

const MERCADONA_BASE_URL = "https://tienda.mercadona.es/api";
const MERCADONA_TIMEOUT_MS = 8000;
const BONPREU_BASE_URL = "https://www.compraonline.bonpreuesclat.cat";
const BONPREU_TIMEOUT_MS = 8000;

type CatalogModuleDependencies = {
  provider?: CatalogProvider;
  cache?: CatalogCache;
};

export function createCatalogModule(deps: CatalogModuleDependencies = {}) {
  const cache = deps.cache ?? new InMemoryCatalogCache();
  const mercadonaProvider = new MercadonaCatalogProvider(
    new MercadonaHttpClient(MERCADONA_BASE_URL, MERCADONA_TIMEOUT_MS),
  );
  const bonpreuProvider = new BonpreuCatalogProvider(
    new BonpreuHttpClient(BONPREU_BASE_URL, BONPREU_TIMEOUT_MS),
  );

  const injectedProvider = deps.provider
    ? withFallbackMetadata(deps.provider)
    : undefined;
  const providers = injectedProvider
    ? [injectedProvider]
    : [mercadonaProvider, bonpreuProvider];
  const resolver = new ProviderStrategyResolver(providers);

  const router = createCatalogRouter({
    getRootCategories: {
      execute: async (provider: string) => {
        const strategy = resolver.resolve(provider);
        return new GetRootCategories(strategy, cache).execute();
      },
    },
    getCategoryDetail: {
      execute: async (provider: string, categoryId: string) => {
        const strategy = resolver.resolve(provider);
        return new GetCategoryDetail(strategy, cache).execute(categoryId);
      },
    },
  });

  return {
    router,
    provider: injectedProvider ?? mercadonaProvider,
    providers,
  };
}

function withFallbackMetadata(provider: CatalogProvider): CatalogProvider {
  return {
    ...provider,
    metadata: provider.metadata ?? {
      id: "provider-mercadona",
      slug: "mercadona",
      displayName: "Mercadona",
    },
  };
}
