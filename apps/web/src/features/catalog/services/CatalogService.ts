import type { CatalogCategoryDetail, GetRootCategoriesResponse } from "./types";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
import {
  adaptCategoryDetailResponse,
  adaptRootCategoriesResponse,
} from "./adapters/CatalogAdapter";

type CatalogServiceOptions = {
  errorMessage?: string;
};

export const getRootCategories = async (
  options: CatalogServiceOptions = {}
): Promise<GetRootCategoriesResponse> => {
  const response = await fetchWithAuth("/api/catalog/categories");

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load categories.");
  }

  const payload = await response.json();

  return adaptRootCategoriesResponse(payload);
};

export const getCategoryDetail = async (
  categoryId: string,
  options: CatalogServiceOptions = {}
): Promise<CatalogCategoryDetail> => {
  const response = await fetchWithAuth(`/api/catalog/categories/${categoryId}`);

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load category detail.");
  }

  const payload = await response.json();

  return adaptCategoryDetailResponse(payload);
};
