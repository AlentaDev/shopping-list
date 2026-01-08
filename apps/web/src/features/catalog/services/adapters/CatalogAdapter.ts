import type {
  CatalogCategoryDetail,
  CatalogCategoryNode,
  CatalogProductSummary,
  GetRootCategoriesResponse,
} from "../types";

export type RootCategoriesPayload = {
  categories?: CatalogCategoryNode[];
};

type CategoryDetailPayload = {
  name?: string;
  subcategories?: Array<{
    name?: string;
    products?: CatalogProductSummary[];
  }>;
};

export const adaptRootCategoriesResponse = (
  payload: RootCategoriesPayload
): GetRootCategoriesResponse => ({
  categories: Array.isArray(payload.categories) ? payload.categories : [],
});

export const adaptCategoryDetailResponse = (
  payload: CategoryDetailPayload
): CatalogCategoryDetail => ({
  categoryName: payload.name ?? "",
  sections: Array.isArray(payload.subcategories)
    ? payload.subcategories.map((subcategory) => ({
        subcategoryName: subcategory.name ?? "",
        products: Array.isArray(subcategory.products)
          ? subcategory.products
          : [],
      }))
    : [],
});
