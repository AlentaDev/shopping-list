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

type BonpreuCategoriesResponse =
  | BonpreuCategoryNode[]
  | {
      categories?: BonpreuCategoryNode[];
    };

type BonpreuCategoryProductsResponse = {
  categoryId: string;
  name: string;
  products?: BonpreuProduct[];
  productGroups?: BonpreuProductGroup[];
};

type BonpreuProduct = {
  retailerProductId: string;
  name: string;
  imagePaths?: string[] | null;
  price?: { amount?: number | null } | null;
};

type BonpreuProductGroup = {
  type: string;
  decoratedProducts?: BonpreuProduct[];
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
    const roots = extractRootCategories(response);

    return {
      count: roots.length,
      next: null,
      previous: null,
      results: roots.map((root, index) => ({
        id: root.categoryId,
        name: root.name,
        order: index,
        is_extended: false,
        categories: (root.childCategories ?? []).map((child, childIndex) => ({
          id: child.categoryId,
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
    const matched = findCategory(extractRootCategories(categories), id);

    if (!matched) {
      return {
        id,
        name: id,
        categories: [],
      };
    }

    const childCategories = matched.childCategories ?? [];
    if (childCategories.length > 0) {
      return {
        id: matched.categoryId,
        name: matched.name,
        categories: childCategories.map((child) => ({
          id: child.categoryId,
          name: child.name,
          products: [],
        })),
      };
    }

    const productsResponse = await this.httpClient.getCategoryProducts<BonpreuCategoryProductsResponse>(
      matched.categoryId,
      matched.productCount,
    );

    return {
      id: matched.categoryId,
      name: matched.name,
      categories: [
        {
          id: matched.categoryId,
          name: matched.name,
          products: extractProducts(productsResponse).map((product) => ({
            id: product.retailerProductId,
            display_name: product.name,
            thumbnail: toBonpreuThumbnail(product.imagePaths),
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
      thumbnail: toBonpreuThumbnail(response.imagePaths),
      price_instructions: {
        unit_price: Number(response.price?.amount ?? 0),
        bulk_price: Number(response.price?.amount ?? 0),
      },
      categories: [],
    };
  }
}

function extractRootCategories(
  response: BonpreuCategoriesResponse,
): BonpreuCategoryNode[] {
  return Array.isArray(response) ? response : response.categories ?? [];
}

function findCategory(
  categories: BonpreuCategoryNode[],
  targetId: string,
): BonpreuCategoryNode | null {
  for (const category of categories) {
    if (matchesCategoryId(category.categoryId, targetId)) {
      return category;
    }

    const nested = findCategory(category.childCategories ?? [], targetId);
    if (nested) {
      return nested;
    }
  }

  return null;
}

function matchesCategoryId(categoryId: string, targetId: string): boolean {
  if (categoryId === targetId) {
    return true;
  }

  return toLegacyDeterministicNumericId(categoryId) === targetId;
}

function extractProducts(
  response?: BonpreuCategoryProductsResponse | null,
): BonpreuProduct[] {
  if (!response) {
    return [];
  }

  const groupedProducts = (response.productGroups ?? []).flatMap(
    (group) => group.decoratedProducts ?? [],
  );

  if (groupedProducts.length > 0) {
    return groupedProducts;
  }

  return response.products ?? [];
}

function toBonpreuThumbnail(imagePaths?: string[] | null): string | null {
  const imagePath = imagePaths?.[0];

  if (!imagePath) {
    return null;
  }

  return `${imagePath}/300x300.webp`;
}

function toLegacyDeterministicNumericId(sourceId: string): string {
  // TEMP_DEBT tracked in apply-progress: remove this bridge once catalog domain fully de-mercadonized.
  void BONPREU_ID_COMPAT_DEBT;

  let hash = 0;
  for (let index = 0; index < sourceId.length; index += 1) {
    hash = (hash * 31 + sourceId.charCodeAt(index)) | 0;
  }

  return String(Math.abs(hash) || 1);
}
