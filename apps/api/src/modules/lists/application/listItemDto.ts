import type { ListItem } from "../domain/list";

export type ListItemDto = {
  id: string;
  kind: "manual" | "catalog";
  name: string;
  qty: number;
  checked: boolean;
  note?: string;
  updatedAt: string;
  thumbnail?: string | null;
  price?: number | null;
  unitSize?: number | null;
  unitFormat?: string | null;
  unitPrice?: number | null;
  isApproxSize?: boolean;
  source?: "mercadona";
  sourceProductId?: string;
};

export function toListItemDto(item: ListItem): ListItemDto {
  if (item.kind === "manual") {
    return {
      id: item.id,
      kind: "manual",
      name: item.name,
      qty: item.qty,
      checked: item.checked,
      note: item.note,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  return {
    id: item.id,
    kind: "catalog",
    name: item.nameSnapshot,
    qty: item.qty,
    checked: item.checked,
    note: item.note,
    updatedAt: item.updatedAt.toISOString(),
    thumbnail: item.thumbnailSnapshot,
    price: item.priceSnapshot,
    unitSize: item.unitSizeSnapshot,
    unitFormat: item.unitFormatSnapshot,
    unitPrice: item.unitPricePerUnitSnapshot,
    isApproxSize: item.isApproxSizeSnapshot,
    source: item.source,
    sourceProductId: item.sourceProductId,
  };
}
