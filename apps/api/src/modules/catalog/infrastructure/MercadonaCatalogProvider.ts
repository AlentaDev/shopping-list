import type {
  CatalogProvider,
  MercadonaCategoryDetailResponse,
  MercadonaRootCategoriesResponse,
} from "../domain/catalogProvider";
import { MercadonaHttpClient } from "./MercadonaHttpClient";

export class MercadonaCatalogProvider implements CatalogProvider {
  constructor(private readonly httpClient: MercadonaHttpClient) {}

  getRootCategories(): Promise<MercadonaRootCategoriesResponse> {
    return this.httpClient.getJson<MercadonaRootCategoriesResponse>("/categories/");
  }

  getCategoryDetail(id: string): Promise<MercadonaCategoryDetailResponse> {
    return this.httpClient.getJson<MercadonaCategoryDetailResponse>(`/categories/${id}/`);
  }
}
