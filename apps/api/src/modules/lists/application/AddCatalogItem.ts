import type {
  CatalogProviderResolver,
  MercadonaProductDetail,
} from "@src/modules/catalog/public.js";
import { AppError } from "@src/shared/errors/appError.js";
import type { ListItem } from "../domain/list.js";
import { resolvePersistedListProviderSlug } from "../domain/list.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import type { IdGenerator, ListRepository } from "./ports.js";
import {
  DraftProviderConflictError,
  CatalogProviderError,
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
  ProviderPayloadContractError,
} from "./errors.js";

const DEFAULT_FALLBACK_CATEGORY = "Sin categoría";

type ProductCategoryNode = {
  name?: string;
  level?: number;
  categories?: ProductCategoryNode[];
};

type ProductCategoryPathNode = { name?: string | null };

type ProductWithOptionalCategoryPath = MercadonaProductDetail & {
  categoryPath?: ProductCategoryPathNode[];
  price?: { amount?: number | null };
};

function readNodeName(node: ProductCategoryNode | null | undefined): string | null {
  if (!node || typeof node.name !== "string") {
    return null;
  }

  const name = node.name.trim();
  return name.length > 0 ? name : null;
}

function readSnapshotsFromCategories(
  product: MercadonaProductDetail,
): { categorySnapshot: string | null; subcategorySnapshot: string | null } {
  const rootCategories = product.categories;

  if (!Array.isArray(rootCategories) || rootCategories.length === 0) {
    return { categorySnapshot: null, subcategorySnapshot: null };
  }

  const level0 = rootCategories[0];
  const level1 = Array.isArray(level0?.categories) ? level0.categories[0] : null;
  const level2 = Array.isArray(level1?.categories) ? level1.categories[0] : null;

  return {
    categorySnapshot: readNodeName(level1),
    subcategorySnapshot: readNodeName(level2),
  };
}

function readSnapshotsFromCategoryPath(
  product: ProductWithOptionalCategoryPath,
): { categorySnapshot: string | null; subcategorySnapshot: string | null } {
  const categoryPath = product.categoryPath;
  if (!Array.isArray(categoryPath) || categoryPath.length === 0) {
    return { categorySnapshot: null, subcategorySnapshot: null };
  }

  const normalized = categoryPath
    .map((node) => (typeof node?.name === "string" ? node.name.trim() : ""))
    .filter((name) => name.length > 0);

  if (normalized.length === 0) {
    return { categorySnapshot: null, subcategorySnapshot: null };
  }

  if (normalized.length === 1) {
    return { categorySnapshot: normalized[0], subcategorySnapshot: null };
  }

  return {
    categorySnapshot: normalized[normalized.length - 2] ?? null,
    subcategorySnapshot: normalized[normalized.length - 1] ?? null,
  };
}

function readPriceAmount(product: ProductWithOptionalCategoryPath): number {
  const rawPriceAmount = product.price?.amount;
  if (typeof rawPriceAmount === "number" && Number.isFinite(rawPriceAmount)) {
    return rawPriceAmount;
  }

  const unitPrice = product.price_instructions?.unit_price;
  if (typeof unitPrice === "number" && Number.isFinite(unitPrice)) {
    return unitPrice;
  }

  throw new ProviderPayloadContractError("price.amount");
}

function readOptionalSnapshot(
  product: MercadonaProductDetail,
  keys: string[],
): string | null {
  const raw = product as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

type AddCatalogItemInput = {
  userId: string;
  listId: string;
  provider: "mercadona" | "bonpreuesclat";
  productId: string;
  qty?: number;
};

export class AddCatalogItem {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
    private readonly catalogProviderResolver: CatalogProviderResolver,
  ) {}

  async execute(input: AddCatalogItemInput): Promise<ListItemDto> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    if (list.status === "COMPLETED") {
      throw new ListStatusTransitionError();
    }

    const listProviderSlug = resolvePersistedListProviderSlug(list.providerId);
    if (!listProviderSlug) {
      throw new AppError(404, "provider_not_found", "Provider not found", {
        provider: "missing_list_provider",
      });
    }

    const draftProvider = this.catalogProviderResolver.resolve(listProviderSlug);
    const catalogProvider = this.catalogProviderResolver.resolve(input.provider);
    const catalogProviderMetadata = catalogProvider.metadata ?? {
      id: `provider-${input.provider}`,
      slug: input.provider,
      displayName: input.provider,
    };
    const draftProviderMetadata = draftProvider.metadata ?? {
      id: list.providerId ?? `provider-${listProviderSlug}`,
      slug: listProviderSlug,
      displayName: listProviderSlug,
    };

    if (listProviderSlug !== input.provider) {
      throw new DraftProviderConflictError({
        draftProvider: {
          id: draftProviderMetadata.id,
          slug: listProviderSlug,
          displayName: draftProviderMetadata.displayName ?? listProviderSlug,
        },
        requestedProvider: {
          id: catalogProviderMetadata.id,
          slug: input.provider,
          displayName: catalogProviderMetadata.displayName ?? catalogProviderMetadata.slug,
        },
        draftSummary: {
          itemCount: list.items.length,
          updatedAt: list.updatedAt.toISOString(),
        },
      });
    }

    let product: MercadonaProductDetail;
    try {
      product = await draftProvider.getProduct(input.productId);
    } catch (_error) {
      throw new CatalogProviderError();
    }

    const now = new Date();
    const typedProduct = product as ProductWithOptionalCategoryPath;
    const snapshotsFromCategoryPath = readSnapshotsFromCategoryPath(typedProduct);
    const snapshotsFromTree = readSnapshotsFromCategories(product);
    const categorySnapshot =
      snapshotsFromCategoryPath.categorySnapshot ??
      snapshotsFromTree.categorySnapshot ??
      readOptionalSnapshot(product, [
      "categorySnapshot",
      "category",
      "categoryName",
      "category_name",
    ]);
    const subcategorySnapshot =
      snapshotsFromCategoryPath.subcategorySnapshot ??
      snapshotsFromTree.subcategorySnapshot ??
      readOptionalSnapshot(product, [
      "subcategorySnapshot",
      "subcategory",
      "subcategoryName",
      "subcategory_name",
    ]);

    const item: ListItem = {
      id: `${list.id}:${String(product.id)}`,
      listId: list.id,
      kind: "catalog",
      source: input.provider,
      sourceProductId: String(product.id),
      nameSnapshot: product.display_name,
      thumbnailSnapshot:
        product.thumbnail ?? product.photos?.[0]?.thumbnail ?? null,
      priceSnapshot: readPriceAmount(typedProduct),
      unitSizeSnapshot: product.price_instructions.unit_size ?? null,
      unitFormatSnapshot: product.price_instructions.size_format ?? null,
      unitPricePerUnitSnapshot:
        product.price_instructions.bulk_price !== undefined &&
        product.price_instructions.bulk_price !== null
          ? Number(product.price_instructions.bulk_price)
          : null,
      isApproxSizeSnapshot: Boolean(product.price_instructions.approx_size),
      categorySnapshot,
      subcategorySnapshot,
      qty: input.qty ?? 1,
      checked: false,
      createdAt: now,
      updatedAt: now,
    };

    if (!item.categorySnapshot && !item.subcategorySnapshot) {
      item.categorySnapshot = DEFAULT_FALLBACK_CATEGORY;
    }

    list.items.push(item);
    list.updatedAt = now;

    await this.listRepository.save(list);

    return toListItemDto(item);
  }
}
