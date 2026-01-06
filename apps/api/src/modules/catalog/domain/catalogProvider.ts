export type MercadonaRootCategory = {
  id: number;
  name: string;
  order: number;
  is_extended: boolean;
  categories: Array<{
    id: number;
    name: string;
    order: number;
    layout: string;
    published: boolean;
    is_extended: boolean;
  }>;
};

export type MercadonaRootCategoriesResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MercadonaRootCategory[];
};

export type MercadonaCategoryProduct = {
  id: string | number;
  packaging: string | null;
  thumbnail: string | null;
  display_name: string;
  price_instructions: {
    unit_price: number;
    unit_size?: number | null;
    bulk_price: number;
    approx_size?: boolean | null;
    size_format?: string | null;
  };
};

export type MercadonaCategoryDetailResponse = {
  id: number;
  name: string;
  categories: Array<{
    id: number;
    name: string;
    products: MercadonaCategoryProduct[];
  }>;
};

export type MercadonaProductDetail = {
  id: string | number;
  display_name: string;
  thumbnail?: string | null;
  photos?: Array<{
    thumbnail?: string | null;
  }>;
  price_instructions: {
    unit_price: number;
    unit_size?: number | null;
    bulk_price?: number | null;
    approx_size?: boolean | null;
    size_format?: string | null;
  };
};

export type CatalogProvider = {
  getRootCategories(): Promise<MercadonaRootCategoriesResponse>;
  getCategoryDetail(id: string): Promise<MercadonaCategoryDetailResponse>;
  getProduct(id: string): Promise<MercadonaProductDetail>;
};
