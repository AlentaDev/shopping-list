import type {
  CatalogProviderMetadata,
  MercadonaCategoryProduct,
  MercadonaProductDetail,
} from "../../domain/catalogProvider.js";
import type {
  CatalogProductSummary,
  CatalogProviderRef,
  GetCategoryDetailResponse,
} from "../../domain/catalogTypes.js";

export type BonpreuUnitPrice = {
  price?: { amount?: number | string | null } | null;
  unit?: string | null;
  unitName?: string | null;
};

export type BonpreuPrice = {
  amount?: number | string | null;
};

export type BonpreuProduct = {
  retailerProductId: string;
  name: string;
  imagePaths?: string[] | null;
  price?: BonpreuPrice | null;
  unitPrice?: BonpreuUnitPrice | null;
  packSizeDescription?: string | null;
};

export type BonpreuProductDetailResponse = {
  retailerProductId: string;
  name: string;
  imagePaths?: string[] | null;
  price?: BonpreuPrice | null;
  unitPrice?: BonpreuUnitPrice | null;
  packSizeDescription?: string | null;
  categoryPath?: Array<{ name?: string }> | null;
};

export type BonpreuProductGroup = {
  type: string;
  decoratedProducts?: BonpreuProduct[];
};

export type BonpreuCategoryProductsResponse = {
  categoryId: string;
  name: string;
  products?: BonpreuProduct[];
  productGroups?: BonpreuProductGroup[];
};

export type BonpreuSearchGroup = {
  type: string;
  products?: BonpreuProduct[];
};

export type BonpreuSearchResponse = {
  productGroups?: BonpreuSearchGroup[];
};

const SEARCH_MAX_PRODUCTS = 30;

type NormalizedProduct = {
  id: string;
  displayName: string;
  thumbnail: string | null;
  packaging: string | null;
  unitPrice: number;
  bulkPrice: number | null;
  sizeFormat: string | null;
};

export class BonpreuCatalogAdapter {
  toProviderCategoryProducts(
    response: BonpreuCategoryProductsResponse,
  ): MercadonaCategoryProduct[] {
    return extractProducts(response).map(toProviderCategoryProduct);
  }

  toProviderProductDetail(
    response: BonpreuProductDetailResponse,
  ): MercadonaProductDetail {
    return toProviderProductDetail(response);
  }

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
          products: extractProducts(response).map((product) =>
            toCatalogProductSummary(product, provider),
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
      .map((product) => toCatalogProductSummary(product, provider));
  }
}

function normalizeProduct(product: BonpreuProduct): NormalizedProduct {
  const mainPrice = readFiniteAmount(product.price?.amount) ?? 0;
  const rawUnitPrice = readUnitPrice(product.unitPrice);
  const sizeFormat =
    rawUnitPrice !== null ? readUnitFormat(product.unitPrice?.unit) : null;
  const bulkPrice =
    rawUnitPrice !== null && sizeFormat !== null ? rawUnitPrice : null;

  return {
    id: product.retailerProductId,
    displayName: product.name,
    thumbnail: toThumbnail(product.imagePaths),
    packaging: product.packSizeDescription ?? null,
    unitPrice: mainPrice,
    bulkPrice,
    sizeFormat,
  };
}

function toProviderCategoryProduct(
  product: BonpreuProduct,
): MercadonaCategoryProduct {
  const normalized = normalizeProduct(product);

  return {
    id: normalized.id,
    display_name: normalized.displayName,
    thumbnail: normalized.thumbnail,
    packaging: normalized.packaging,
    price_instructions: {
      unit_price: normalized.unitPrice,
      bulk_price: normalized.bulkPrice,
      size_format: normalized.sizeFormat,
    },
  };
}

function toProviderProductDetail(
  product: BonpreuProductDetailResponse,
): MercadonaProductDetail {
  const normalized = normalizeProduct(product);

  return {
    id: normalized.id,
    display_name: normalized.displayName,
    thumbnail: normalized.thumbnail,
    packaging: normalized.packaging,
    price_instructions: {
      unit_price: normalized.unitPrice,
      bulk_price: normalized.bulkPrice,
      size_format: normalized.sizeFormat,
    },
    categories: [],
  };
}

function toCatalogProductSummary(
  product: BonpreuProduct,
  providerMetadata: CatalogProviderMetadata,
): CatalogProductSummary {
  const normalized = normalizeProduct(product);

  return {
    id: normalized.id,
    name: normalized.displayName,
    thumbnail: normalized.thumbnail,
    packaging: normalized.packaging,
    price: normalized.unitPrice,
    unitSize: null,
    unitFormat: normalized.sizeFormat,
    unitPrice: normalized.bulkPrice,
    isApproxSize: false,
    provider: toProviderRef(providerMetadata),
  };
}

function toThumbnail(imagePaths?: string[] | null): string | null {
  const imagePath = imagePaths?.[0];

  if (!imagePath) {
    return null;
  }

  return `${imagePath}/300x300.webp`;
}

function toProviderRef(metadata: CatalogProviderMetadata): CatalogProviderRef {
  return {
    id: metadata.id,
    slug: metadata.slug,
    displayName: metadata.displayName ?? metadata.slug,
  };
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

const KNOWN_UNIT_FORMATS = new Set([
  "bag",
  "bottle",
  "box",
  "can",
  "capsule",
  "cl",
  "dozen",
  "each",
  "g",
  "gr",
  "jar",
  "kg",
  "l",
  "liter",
  "litre",
  "ml",
  "pack",
  "packet",
  "piece",
  "portion",
  "roll",
  "sachet",
  "slice",
  "tablet",
  "ud",
  "unit",
  "units",
]);

function readFiniteAmount(amount: unknown): number | null {
  if (typeof amount === "number" && Number.isFinite(amount)) {
    return amount;
  }

  if (typeof amount === "string") {
    const trimmed = amount.trim();
    if (trimmed.length === 0) {
      return null;
    }

    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function readUnitPrice(unitPrice?: BonpreuUnitPrice | null): number | null {
  const amount = unitPrice?.price?.amount;
  return readFiniteAmount(amount);
}

function readUnitFormat(unit?: string | null): string | null {
  if (!unit || typeof unit !== "string") {
    return null;
  }

  const segments = unit.split(".");
  const lastSegment = segments.pop() ?? "";
  const normalized = lastSegment.trim().toLowerCase();
  if (normalized.length === 0 || !KNOWN_UNIT_FORMATS.has(normalized)) {
    return null;
  }

  if (normalized === "each") {
    return "ud";
  }

  return lastSegment.trim();
}
