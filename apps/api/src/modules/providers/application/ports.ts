import type { Provider } from "../domain/provider.js";

export interface ProviderRepository {
  findBySlug(slug: string): Promise<Provider | null>;
}
