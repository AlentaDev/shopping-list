import type {
  CatalogProvider,
  MercadonaCategoryDetailResponse,
  MercadonaProductDetail,
  MercadonaRootCategoriesResponse,
} from "../domain/catalogProvider.js";
import { MercadonaHttpClient } from "./MercadonaHttpClient.js";

export class MercadonaCatalogProvider implements CatalogProvider {
  constructor(private readonly httpClient: MercadonaHttpClient) {}

  getRootCategories(): Promise<MercadonaRootCategoriesResponse> {
    return this.httpClient.getJson<MercadonaRootCategoriesResponse>(
      "/categories/",
    );
  }

  getCategoryDetail(id: string): Promise<MercadonaCategoryDetailResponse> {
    return this.httpClient.getJson<MercadonaCategoryDetailResponse>(
      `/categories/${id}/`,
    );
  }

  getProduct(id: string): Promise<MercadonaProductDetail> {
    return this.httpClient.getJson<MercadonaProductDetail>(`/products/${id}/`);
  }
}
