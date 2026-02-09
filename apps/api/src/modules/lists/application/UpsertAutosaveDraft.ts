import type { List, ListItem } from "../domain/list.js";
import type { IdGenerator, ListRepository } from "./ports.js";

type AutosaveItemInput =
  | {
      id: string;
      kind: "manual";
      name: string;
      qty: number;
      checked: boolean;
    }
  | {
      id: string;
      kind: "catalog";
      name: string;
      qty: number;
      checked: boolean;
      source: "mercadona";
      sourceProductId: string;
      thumbnail?: string | null;
      price?: number | null;
      unitSize?: number | null;
      unitFormat?: string | null;
      unitPrice?: number | null;
      isApproxSize?: boolean;
    };

type UpsertAutosaveDraftInput = {
  userId: string;
  title: string;
  items: AutosaveItemInput[];
};

type AutosaveDraftSummary = {
  id: string;
  title: string;
  updatedAt: string;
};

export class UpsertAutosaveDraft {
  constructor(
    private readonly listRepository: ListRepository,
    private readonly idGenerator: IdGenerator,
  ) {}

  async execute(input: UpsertAutosaveDraftInput): Promise<AutosaveDraftSummary> {
    const lists = await this.listRepository.listByOwner(input.userId);
    const autosaveDrafts = lists.filter((list) => list.isAutosaveDraft);
    const now = new Date();
    const latestAutosave =
      autosaveDrafts.length === 0
        ? null
        : autosaveDrafts.reduce((latest, current) =>
            current.updatedAt > latest.updatedAt ? current : latest,
          );

    const listId = latestAutosave?.id ?? this.idGenerator.generate();
    const list: List = {
      id: listId,
      ownerUserId: input.userId,
      title: input.title,
      isAutosaveDraft: true,
      status: "DRAFT",
      items: input.items.map((item) =>
        toListItem(item, listId, now, this.idGenerator),
      ),
      isEditing: false,
      createdAt: latestAutosave?.createdAt ?? now,
      updatedAt: now,
    };

    await this.listRepository.save(list);

    return {
      id: list.id,
      title: list.title,
      updatedAt: list.updatedAt.toISOString(),
    };
  }
}

function toListItem(
  item: AutosaveItemInput,
  listId: string,
  now: Date,
  idGenerator: IdGenerator,
): ListItem {
  const itemId = idGenerator.generate();
  if (item.kind === "manual") {
    return {
      id: itemId,
      listId,
      kind: "manual",
      name: item.name,
      qty: item.qty,
      checked: item.checked,
      createdAt: now,
      updatedAt: now,
    };
  }

  return {
    id: itemId,
    listId,
    kind: "catalog",
    source: item.source,
    sourceProductId: item.sourceProductId,
    nameSnapshot: item.name,
    thumbnailSnapshot: item.thumbnail ?? null,
    priceSnapshot: item.price ?? null,
    unitSizeSnapshot: item.unitSize ?? null,
    unitFormatSnapshot: item.unitFormat ?? null,
    unitPricePerUnitSnapshot: item.unitPrice ?? null,
    isApproxSizeSnapshot: item.isApproxSize ?? false,
    qty: item.qty,
    checked: item.checked,
    createdAt: now,
    updatedAt: now,
  };
}
