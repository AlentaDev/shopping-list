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

export type GetRootCategoriesResponse = {
  categories: CatalogCategoryNode[];
};

export type GetCategoryDetailResponse = {
  id: string;
  name: string;
  subcategories: Array<{
    id: string;
    name: string;
    products: CatalogProductSummary[];
  }>;
};
