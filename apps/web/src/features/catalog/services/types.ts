export type CatalogCategoryNode = {
  id: string;
  name: string;
  order: number;
  level: number;
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

export type CatalogProductDetail = {
  id: string;
  name: string;
  brand: string | null;
  origin: string | null;
  photos: string[];
  description: string | null;
  usageInstructions: string | null;
  storageInstructions: string | null;
  ingredients: string | null;
  allergens: string | null;
};

export type CatalogCategorySection = {
  subcategoryId: string;
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
