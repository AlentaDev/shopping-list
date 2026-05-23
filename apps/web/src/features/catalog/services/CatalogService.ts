import type { CatalogCategoryDetail, GetRootCategoriesResponse } from "./types";
import { fetchWithAuth } from "@src/infrastructure/http/fetchWithAuthRuntime";
import {
  adaptCategoryDetailResponse,
  adaptRootCategoriesResponse,
} from "./adapters/CatalogAdapter";

type CatalogServiceOptions = {
  errorMessage?: string;
};

export const getRootCategories = async (
  providerId: string,
  options: CatalogServiceOptions = {}
): Promise<GetRootCategoriesResponse> => {
  const response = await fetchWithAuth(`/api/catalog/${providerId}/categories`);

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load categories.");
  }

  const payload = await response.json();

  return adaptRootCategoriesResponse(payload);
};

export const getCategoryDetail = async (
  providerId: string,
  categoryId: string,
  options: CatalogServiceOptions = {}
): Promise<CatalogCategoryDetail> => {
  const response = await fetchWithAuth(
    `/api/catalog/${providerId}/categories/${categoryId}`,
  );

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load category detail.");
  }

  const payload = await response.json();

  return adaptCategoryDetailResponse(payload);
};
