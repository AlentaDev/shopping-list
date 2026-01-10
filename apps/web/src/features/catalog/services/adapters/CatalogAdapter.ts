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
  payload: unknown
): GetRootCategoriesResponse => {
  const data = payload as RootCategoriesPayload;
  return {
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
};

export const adaptCategoryDetailResponse = (
  payload: unknown
): CatalogCategoryDetail => {
  const data = payload as CategoryDetailPayload;
  return {
    categoryName: data.name ?? "",
    sections: Array.isArray(data.subcategories)
      ? data.subcategories.map((subcategory) => ({
          subcategoryName: subcategory.name ?? "",
          products: Array.isArray(subcategory.products)
            ? subcategory.products
            : [],
        }))
      : [],
  };
};
