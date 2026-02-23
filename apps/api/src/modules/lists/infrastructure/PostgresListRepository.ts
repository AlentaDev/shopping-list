import type { List, ListItem, ListStatus } from "../domain/list.js";
import { LIST_STATUSES, normalizeEditingState } from "../domain/list.js";
import type { ListRepository } from "../application/ports.js";

type PgPool = {
  query: (
    text: string,
    params?: ReadonlyArray<unknown>,
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

const LIST_COLUMNS =
  "id, owner_user_id, title, status, is_autosave_draft, activated_at, is_editing, editing_target_list_id, created_at, updated_at" as const;
const ITEM_COLUMNS =
  "id, list_id, source, source_product_id, name_snapshot, thumbnail_snapshot, price_snapshot, unit_size_snapshot, unit_format_snapshot, unit_price_per_unit_snapshot, is_approx_size_snapshot, qty, checked, created_at, updated_at" as const;

export class PostgresListRepository implements ListRepository {
  constructor(private readonly pool: PgPool) {}

  async findById(id: string): Promise<List | null> {
    const listResult = await this.pool.query(
      `SELECT ${LIST_COLUMNS} FROM lists WHERE id = $1`,
      [id],
    );

    if (listResult.rows.length === 0) {
      return null;
    }

    const itemsResult = await this.pool.query(
      `SELECT ${ITEM_COLUMNS} FROM list_items WHERE list_id = $1 ORDER BY created_at ASC`,
      [id],
    );

    return mapListWithItems(listResult.rows[0], itemsResult.rows);
  }

  async listByOwner(ownerUserId: string): Promise<List[]> {
    const listsResult = await this.pool.query(
      `SELECT ${LIST_COLUMNS} FROM lists WHERE owner_user_id = $1 ORDER BY updated_at DESC`,
      [ownerUserId],
    );

    if (listsResult.rows.length === 0) {
      return [];
    }

    const listIds = listsResult.rows.map((row) => String(row.id));
    const itemsResult = await this.pool.query(
      `SELECT ${ITEM_COLUMNS} FROM list_items WHERE list_id = ANY($1::text[]) ORDER BY created_at ASC`,
      [listIds],
    );

    const itemsByListId = groupItemsByListId(itemsResult.rows);

    return listsResult.rows.map((row) =>
      mapListWithItems(row, itemsByListId.get(String(row.id)) ?? []),
    );
  }

  async save(list: List): Promise<void> {
    const normalizedEditingState = normalizeEditingState({
      status: list.status,
      isEditing: list.isEditing,
      editingTargetListId: list.editingTargetListId,
    });

    await this.pool.query("BEGIN");
    try {
      await this.pool.query(
        "INSERT INTO lists (id, owner_user_id, title, status, is_autosave_draft, activated_at, is_editing, editing_target_list_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id, title = EXCLUDED.title, status = EXCLUDED.status, is_autosave_draft = EXCLUDED.is_autosave_draft, activated_at = EXCLUDED.activated_at, is_editing = EXCLUDED.is_editing, editing_target_list_id = EXCLUDED.editing_target_list_id, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at",
        [
          list.id,
          list.ownerUserId,
          list.title,
          list.status,
          list.isAutosaveDraft,
          list.activatedAt ?? null,
          normalizedEditingState.isEditing,
          normalizedEditingState.editingTargetListId,
          list.createdAt,
          list.updatedAt,
        ],
      );

      await this.pool.query("DELETE FROM list_items WHERE list_id = $1", [
        list.id,
      ]);

      for (const item of list.items) {
        await this.pool.query(
          "INSERT INTO list_items (id, list_id, source, source_product_id, name_snapshot, thumbnail_snapshot, price_snapshot, unit_size_snapshot, unit_format_snapshot, unit_price_per_unit_snapshot, is_approx_size_snapshot, qty, checked, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
          buildItemValues(item),
        );
      }

      await this.pool.query("COMMIT");
    } catch (error) {
      await this.pool.query("ROLLBACK");
      throw error;
    }
  }

  async deleteById(id: string): Promise<void> {
    await this.pool.query("BEGIN");
    try {
      await this.pool.query("DELETE FROM list_items WHERE list_id = $1", [id]);
      await this.pool.query("DELETE FROM lists WHERE id = $1", [id]);
      await this.pool.query("COMMIT");
    } catch (error) {
      await this.pool.query("ROLLBACK");
      throw error;
    }
  }
}

function mapListWithItems(
  listRow: Record<string, unknown>,
  itemRows: Array<Record<string, unknown>>,
): List {
  const statusValue = String(listRow.status ?? "DRAFT");
  const status = LIST_STATUSES.includes(statusValue as ListStatus)
    ? (statusValue as ListStatus)
    : "DRAFT";

  const normalizedEditingState = normalizeEditingState({
    status,
    isEditing: Boolean(listRow.is_editing),
    editingTargetListId:
      listRow.editing_target_list_id !== null &&
      listRow.editing_target_list_id !== undefined
        ? String(listRow.editing_target_list_id)
        : null,
  });

  return {
    id: String(listRow.id),
    ownerUserId: String(listRow.owner_user_id),
    title: String(listRow.title),
    isAutosaveDraft: Boolean(listRow.is_autosave_draft),
    status,
    activatedAt: listRow.activated_at
      ? parsePgDate(listRow.activated_at)
      : undefined,
    isEditing: normalizedEditingState.isEditing,
    editingTargetListId: normalizedEditingState.editingTargetListId,
    createdAt: parsePgDate(listRow.created_at),
    updatedAt: parsePgDate(listRow.updated_at),
    items: itemRows.map(mapItemRow),
  };
}

function groupItemsByListId(
  itemRows: Array<Record<string, unknown>>,
): Map<string, Array<Record<string, unknown>>> {
  const itemsByListId = new Map<string, Array<Record<string, unknown>>>();

  for (const row of itemRows) {
    const listId = String(row.list_id);
    const items = itemsByListId.get(listId) ?? [];
    items.push(row);
    itemsByListId.set(listId, items);
  }

  return itemsByListId;
}

function mapItemRow(row: Record<string, unknown>): ListItem {
  return {
    id: String(row.id),
    listId: String(row.list_id),
    kind: "catalog",
    source: "mercadona",
    sourceProductId: String(row.source_product_id),
    nameSnapshot: String(row.name_snapshot),
    thumbnailSnapshot: row.thumbnail_snapshot
      ? String(row.thumbnail_snapshot)
      : null,
    priceSnapshot:
      row.price_snapshot !== null && row.price_snapshot !== undefined
        ? Number(row.price_snapshot)
        : null,
    unitSizeSnapshot:
      row.unit_size_snapshot !== null && row.unit_size_snapshot !== undefined
        ? Number(row.unit_size_snapshot)
        : null,
    unitFormatSnapshot: row.unit_format_snapshot
      ? String(row.unit_format_snapshot)
      : null,
    unitPricePerUnitSnapshot:
      row.unit_price_per_unit_snapshot !== null &&
      row.unit_price_per_unit_snapshot !== undefined
        ? Number(row.unit_price_per_unit_snapshot)
        : null,
    isApproxSizeSnapshot: Boolean(row.is_approx_size_snapshot),
    qty: Number(row.qty),
    checked: Boolean(row.checked),
    createdAt: parsePgDate(row.created_at),
    updatedAt: parsePgDate(row.updated_at),
  };
}

function parsePgDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

function buildItemValues(item: ListItem): Array<unknown> {
  if (item.kind !== "catalog") {
    throw new Error(
      `Unsupported list item kind in Postgres repository: ${item.kind}`,
    );
  }

  return [
    item.id,
    item.listId,
    item.source,
    item.sourceProductId,
    item.nameSnapshot,
    item.thumbnailSnapshot,
    item.priceSnapshot,
    item.unitSizeSnapshot,
    item.unitFormatSnapshot,
    item.unitPricePerUnitSnapshot,
    item.isApproxSizeSnapshot,
    item.qty,
    item.checked,
    item.createdAt,
    item.updatedAt,
  ];
}
