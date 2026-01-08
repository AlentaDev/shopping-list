export type CatalogCategoryNode = {
  id: string;
  name: string;
  order: number;
  level: 0 | 1 | 2;
  parentId?: string;
  published?: boolean;
};

export type CatalogProductSummary = {
  id: string;
  name: string;
  thumbnail: string | null;
  packaging: string | null;
  price: number;
  unitSize: number | null;
  unitFormat: string | null;
  unitPrice: number | null;
  isApproxSize: boolean;
};

export type CatalogCategorySection = {
  subcategoryName: string;
  products: CatalogProductSummary[];
};

export type CatalogCategoryDetail = {
  categoryName: string;
  sections: CatalogCategorySection[];
};

export type GetRootCategoriesResponse = {
  categories: CatalogCategoryNode[];
};
