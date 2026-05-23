import type {
  CatalogProvider,
  MercadonaProductDetail,
} from "@src/modules/catalog/public.js";
import type { ListItem } from "../domain/list.js";
import { resolveListProviderSlug } from "../domain/list.js";
import { toListItemDto, type ListItemDto } from "./listItemDto.js";
import type { IdGenerator, ListRepository } from "./ports.js";
import {
  CatalogProviderError,
  ListForbiddenError,
  ListNotFoundError,
  ListStatusTransitionError,
} from "./errors.js";

const DEFAULT_FALLBACK_CATEGORY = "Sin categoría";

type ProductCategoryNode = {
  name?: string;
  level?: number;
  categories?: ProductCategoryNode[];
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
  provider: "mercadona";
  productId: string;
  qty?: number;
};

export class AddCatalogItem {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
    private readonly catalogProvider: CatalogProvider,
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

    const listProviderSlug = resolveListProviderSlug(list.providerId);

    if (listProviderSlug !== input.provider) {
      throw new ListStatusTransitionError();
    }

    let product: MercadonaProductDetail;
    try {
      product = await this.catalogProvider.getProduct(input.productId);
    } catch (_error) {
      throw new CatalogProviderError();
    }

    const now = new Date();
    const snapshotsFromTree = readSnapshotsFromCategories(product);
    const categorySnapshot =
      snapshotsFromTree.categorySnapshot ??
      readOptionalSnapshot(product, [
      "categorySnapshot",
      "category",
      "categoryName",
      "category_name",
    ]);
    const subcategorySnapshot =
      snapshotsFromTree.subcategorySnapshot ??
      readOptionalSnapshot(product, [
      "subcategorySnapshot",
      "subcategory",
      "subcategoryName",
      "subcategory_name",
    ]);

    const item: ListItem = {
      id: this.idGenerator.generate(),
      listId: list.id,
      kind: "catalog",
      source: "mercadona",
      sourceProductId: String(product.id),
      nameSnapshot: product.display_name,
      thumbnailSnapshot:
        product.thumbnail ?? product.photos?.[0]?.thumbnail ?? null,
      priceSnapshot: Number(product.price_instructions.unit_price),
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
