import type {
  CatalogCategoryNode,
  GetCategoryDetailResponse,
  GetRootCategoriesResponse,
} from "../types";

export type RootCategoriesPayload = {
  categories?: CatalogCategoryNode[];
};

export type CategoryDetailPayload = {
  id?: string;
  name?: string;
  subcategories?: GetCategoryDetailResponse["subcategories"];
};

export const adaptRootCategoriesResponse = (
  payload: RootCategoriesPayload
): GetRootCategoriesResponse => ({
  categories: Array.isArray(payload.categories) ? payload.categories : [],
});

export const adaptCategoryDetailResponse = (
  payload: CategoryDetailPayload
): GetCategoryDetailResponse => ({
  id: payload.id ?? "",
  name: payload.name ?? "",
  subcategories: Array.isArray(payload.subcategories)
    ? payload.subcategories
    : [],
});
