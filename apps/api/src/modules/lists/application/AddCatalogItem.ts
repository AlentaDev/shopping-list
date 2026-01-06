import type { CatalogProvider, MercadonaProductDetail } from "../../catalog/public";
import type { ListItem } from "../domain/list";
import { toListItemDto, type ListItemDto } from "./listItemDto";
import type { IdGenerator, ListRepository } from "./ports";
import {
  CatalogProviderError,
  ListForbiddenError,
  ListNotFoundError,
} from "./errors";

type AddCatalogItemInput = {
  userId: string;
  listId: string;
  productId: string;
  qty?: number;
  note?: string;
};

export class AddCatalogItem {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
    private readonly catalogProvider: CatalogProvider
  ) {}

  async execute(input: AddCatalogItemInput): Promise<ListItemDto> {
    const list = await this.listRepository.findById(input.listId);
    if (!list) {
      throw new ListNotFoundError();
    }

    if (list.ownerUserId !== input.userId) {
      throw new ListForbiddenError();
    }

    let product: MercadonaProductDetail;
    try {
      product = await this.catalogProvider.getProduct(input.productId);
    } catch (_error) {
      throw new CatalogProviderError();
    }

    const now = new Date();
    const item: ListItem = {
      id: this.idGenerator.generate(),
      listId: list.id,
      kind: "catalog",
      source: "mercadona",
      sourceProductId: String(product.id),
      nameSnapshot: product.display_name,
      thumbnailSnapshot: product.thumbnail ?? product.photos?.[0]?.thumbnail ?? null,
      priceSnapshot: Number(product.price_instructions.unit_price),
      unitSizeSnapshot: product.price_instructions.unit_size ?? null,
      unitFormatSnapshot: product.price_instructions.size_format ?? null,
      unitPricePerUnitSnapshot:
        product.price_instructions.bulk_price !== undefined &&
        product.price_instructions.bulk_price !== null
          ? Number(product.price_instructions.bulk_price)
          : null,
      isApproxSizeSnapshot: Boolean(product.price_instructions.approx_size),
      qty: input.qty ?? 1,
      checked: false,
      note: input.note,
      createdAt: now,
      updatedAt: now,
    };

    list.items.push(item);
    list.updatedAt = now;

    await this.listRepository.save(list);

    return toListItemDto(item);
  }
}
