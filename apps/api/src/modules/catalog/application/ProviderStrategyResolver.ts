import { AppError } from "@src/shared/errors/appError.js";
import type {
  CatalogProvider,
  CatalogProviderSlug,
} from "../domain/catalogProvider.js";

export class ProviderStrategyResolver {
  private readonly providersBySlug: Map<CatalogProviderSlug, CatalogProvider>;

  constructor(providers: CatalogProvider[]) {
    this.providersBySlug = new Map(
      providers.map((provider) => [provider.metadata?.slug ?? "mercadona", provider]),
    );
  }

  resolve(slug: string): CatalogProvider {
    const provider = this.providersBySlug.get(slug as CatalogProviderSlug);
    if (provider) {
      return provider;
    }

    throw new AppError(404, "provider_not_found", "Provider not found", {
      provider: slug,
    });
  }
}
