import type { CatalogProviderMetadata } from "../../domain/catalogProvider.js";
import type {
  CatalogProductSummary,
  CatalogProviderRef,
  GetCategoryDetailResponse,
} from "../../domain/catalogTypes.js";

type BonpreuPrice = {
  amount?: number | null;
};

type BonpreuProduct = {
  retailerProductId: string;
  name: string;
  imagePaths?: string[] | null;
  price?: BonpreuPrice | null;
  categoryPath?: string[];
};

type BonpreuCategoryProductsResponse = {
  categoryId: string;
  name: string;
  products: BonpreuProduct[];
};

type BonpreuSearchGroup = {
  type: string;
  products?: BonpreuProduct[];
};

type BonpreuSearchResponse = {
  productGroups?: BonpreuSearchGroup[];
};

const SEARCH_MAX_PRODUCTS = 30;

export class BonpreuCatalogAdapter {
  toCategoryProducts(
    response: BonpreuCategoryProductsResponse,
    provider: CatalogProviderMetadata,
  ): GetCategoryDetailResponse {
    return {
      id: String(response.categoryId),
      name: response.name,
      subcategories: [
        {
          id: String(response.categoryId),
          name: response.name,
          products: response.products.map((product) =>
            this.mapProduct(product, provider),
          ),
        },
      ],
    };
  }

  toSearchProducts(
    response: BonpreuSearchResponse,
    provider: CatalogProviderMetadata,
  ): CatalogProductSummary[] {
    const groups = response.productGroups ?? [];
    const products = groups.flatMap((group) => group.products ?? []);

    return products
      .slice(0, SEARCH_MAX_PRODUCTS)
      .map((product) => this.mapProduct(product, provider));
  }

  private mapProduct(
    product: BonpreuProduct,
    providerMetadata: CatalogProviderMetadata,
  ): CatalogProductSummary {
    return {
      id: product.retailerProductId,
      name: product.name,
      thumbnail: toThumbnail(product.imagePaths),
      packaging: null,
      price: Number(product.price?.amount ?? 0),
      unitSize: null,
      unitFormat: null,
      unitPrice: null,
      isApproxSize: false,
      provider: toProviderRef(providerMetadata),
    };
  }
}

function toThumbnail(imagePaths?: string[] | null): string | null {
  if (!imagePaths || imagePaths.length === 0) {
    return null;
  }

  return imagePaths[0] ?? null;
}

function toProviderRef(metadata: CatalogProviderMetadata): CatalogProviderRef {
  return {
    id: metadata.id,
    slug: metadata.slug,
    displayName: metadata.displayName ?? metadata.slug,
  };
}
