import type {
  CatalogProvider,
  MercadonaCategoryDetailResponse,
  MercadonaProductDetail,
  MercadonaRootCategoriesResponse,
} from "../domain/catalogProvider.js";
import { BonpreuHttpClient } from "./BonpreuHttpClient.js";

type BonpreuCategoryNode = {
  categoryId: string;
  name: string;
  level: number;
  productCount: number;
  childCategories?: BonpreuCategoryNode[];
};

type BonpreuCategoriesResponse = {
  categories?: BonpreuCategoryNode[];
};

type BonpreuCategoryProductsResponse = {
  categoryId: string;
  name: string;
  products: Array<{
    retailerProductId: string;
    name: string;
    imagePaths?: string[] | null;
    price?: { amount?: number | null } | null;
  }>;
};

const BONPREU_ID_COMPAT_DEBT =
  "TEMP_DEBT: de-mercadonization pending. Keep Mercadona-shaped provider contract bridge until canonical contract rollout is complete.";

export class BonpreuCatalogProvider implements CatalogProvider {
  readonly metadata = {
    id: "provider-bonpreuesclat",
    slug: "bonpreuesclat",
    displayName: "BonpreuEsclat",
  } as const;

  constructor(private readonly httpClient: BonpreuHttpClient) {}

  async getRootCategories(): Promise<MercadonaRootCategoriesResponse> {
    const response = await this.httpClient.getCategories<BonpreuCategoriesResponse>();
    const roots = response.categories ?? [];

    return {
      count: roots.length,
      next: null,
      previous: null,
      results: roots.map((root, index) => ({
        id: toDeterministicNumericId(root.categoryId),
        name: root.name,
        order: index,
        is_extended: false,
        categories: (root.childCategories ?? []).map((child, childIndex) => ({
          id: toDeterministicNumericId(child.categoryId),
          name: child.name,
          order: childIndex,
          layout: "grid",
          published: true,
          is_extended: false,
        })),
      })),
    };
  }

  async getCategoryDetail(id: string): Promise<MercadonaCategoryDetailResponse> {
    const categories = await this.httpClient.getCategories<BonpreuCategoriesResponse>();
    const matched = findCategory(categories.categories ?? [], id);

    if (!matched) {
      return {
        id: toDeterministicNumericId(id),
        name: id,
        categories: [],
      };
    }

    const isLeaf = (matched.childCategories ?? []).length === 0;
    const productsResponse = isLeaf
      ? await this.httpClient.getCategoryProducts<BonpreuCategoryProductsResponse>(
          matched.categoryId,
          matched.productCount,
        )
      : null;

    return {
      id: toDeterministicNumericId(matched.categoryId),
      name: matched.name,
      categories: [
        {
          id: toDeterministicNumericId(matched.categoryId),
          name: matched.name,
          products: (productsResponse?.products ?? []).map((product) => ({
            id: product.retailerProductId,
            display_name: product.name,
            thumbnail: product.imagePaths?.[0] ?? null,
            packaging: null,
            price_instructions: {
              unit_price: Number(product.price?.amount ?? 0),
              bulk_price: Number(product.price?.amount ?? 0),
            },
          })),
        },
      ],
    };
  }

  async getProduct(id: string): Promise<MercadonaProductDetail> {
    const response = await this.httpClient.getProductDetail<{
      retailerProductId: string;
      name: string;
      imagePaths?: string[] | null;
      price?: { amount?: number | null } | null;
      categoryPath?: string[];
    }>(id);

    return {
      id: response.retailerProductId,
      display_name: response.name,
      thumbnail: response.imagePaths?.[0] ?? null,
      price_instructions: {
        unit_price: Number(response.price?.amount ?? 0),
        bulk_price: Number(response.price?.amount ?? 0),
      },
      categories: [],
    };
  }
}

function findCategory(
  categories: BonpreuCategoryNode[],
  targetId: string,
): BonpreuCategoryNode | null {
  for (const category of categories) {
    if (category.categoryId === targetId) {
      return category;
    }

    const nested = findCategory(category.childCategories ?? [], targetId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function toDeterministicNumericId(sourceId: string): number {
  // TEMP_DEBT tracked in apply-progress: remove this bridge once catalog domain fully de-mercadonized.
  void BONPREU_ID_COMPAT_DEBT;

  let hash = 0;
  for (let index = 0; index < sourceId.length; index += 1) {
    hash = (hash * 31 + sourceId.charCodeAt(index)) | 0;
  }

  return Math.abs(hash) || 1;
}
