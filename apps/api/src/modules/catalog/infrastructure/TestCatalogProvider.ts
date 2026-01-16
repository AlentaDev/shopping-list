import type {
  CatalogProvider,
  MercadonaCategoryDetailResponse,
  MercadonaProductDetail,
  MercadonaRootCategoriesResponse,
} from "../domain/catalogProvider";

const ROOT_CATEGORY_ID = 1;
const SUBCATEGORY_ID = 11;
const PRODUCT_ID = 101;

const ROOT_CATEGORIES_RESPONSE: MercadonaRootCategoriesResponse = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: ROOT_CATEGORY_ID,
      name: "Frescos",
      order: 1,
      is_extended: false,
      categories: [
        {
          id: SUBCATEGORY_ID,
          name: "Frutas",
          order: 1,
          layout: "grid",
          published: true,
          is_extended: false,
        },
      ],
    },
  ],
};

const CATEGORY_DETAIL_RESPONSE: MercadonaCategoryDetailResponse = {
  id: SUBCATEGORY_ID,
  name: "Frutas",
  categories: [
    {
      id: SUBCATEGORY_ID,
      name: "Frutas frescas",
      products: [
        {
          id: PRODUCT_ID,
          packaging: null,
          thumbnail: null,
          display_name: "Manzana",
          price_instructions: {
            unit_price: 1.5,
            unit_size: 1,
            bulk_price: 1.5,
            approx_size: false,
            size_format: "kg",
          },
        },
      ],
    },
  ],
};

const PRODUCT_DETAIL_RESPONSE: MercadonaProductDetail = {
  id: PRODUCT_ID,
  display_name: "Manzana",
  thumbnail: null,
  photos: [],
  price_instructions: {
    unit_price: 1.5,
    unit_size: 1,
    bulk_price: 1.5,
    approx_size: false,
    size_format: "kg",
  },
};

export class TestCatalogProvider implements CatalogProvider {
  async getRootCategories(): Promise<MercadonaRootCategoriesResponse> {
    return ROOT_CATEGORIES_RESPONSE;
  }

  async getCategoryDetail(id: string): Promise<MercadonaCategoryDetailResponse> {
    if (String(SUBCATEGORY_ID) !== id) {
      throw new Error(`Unknown category id: ${id}`);
    }

    return CATEGORY_DETAIL_RESPONSE;
  }

  async getProduct(id: string): Promise<MercadonaProductDetail> {
    if (String(PRODUCT_ID) !== id) {
      throw new Error(`Unknown product id: ${id}`);
    }

    return PRODUCT_DETAIL_RESPONSE;
  }
}
