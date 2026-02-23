import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import { PostgresListRepository } from "./PostgresListRepository.js";

const baseList = {
  id: "list-1",
  ownerUserId: "user-1",
  title: "Weekly groceries",
  isAutosaveDraft: false,
  status: "DRAFT",
  activatedAt: new Date("2024-01-01T09:30:00.000Z"),
  isEditing: false,
  editingTargetListId: null,
  createdAt: new Date("2024-01-01T10:00:00.000Z"),
  updatedAt: new Date("2024-01-02T10:00:00.000Z"),
} as const;

const catalogItem = {
  id: "item-1",
  listId: "list-1",
  kind: "catalog",
  source: "mercadona",
  sourceProductId: "sku-123",
  nameSnapshot: "Yogurt",
  thumbnailSnapshot: "thumb.png",
  priceSnapshot: 1.25,
  unitSizeSnapshot: 500,
  unitFormatSnapshot: "g",
  unitPricePerUnitSnapshot: 0.0025,
  isApproxSizeSnapshot: false,
  qty: 1,
  checked: true,
  createdAt: new Date("2024-01-01T10:20:00.000Z"),
  updatedAt: new Date("2024-01-01T10:22:00.000Z"),
} as const;

const catalogItemTwo = {
  id: "item-2",
  listId: "list-2",
  kind: "catalog",
  source: "mercadona",
  sourceProductId: "sku-999",
  nameSnapshot: "Bread",
  thumbnailSnapshot: null,
  priceSnapshot: null,
  unitSizeSnapshot: null,
  unitFormatSnapshot: null,
  unitPricePerUnitSnapshot: null,
  isApproxSizeSnapshot: false,
  qty: 1,
  checked: false,
  createdAt: baseList.createdAt,
  updatedAt: baseList.updatedAt,
} as const;

const list: List = {
  ...baseList,
  items: [catalogItem],
};

describe("PostgresListRepository", () => {
  it("returns a list with items when found by id", async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: baseList.id,
              owner_user_id: baseList.ownerUserId,
              title: baseList.title,
              status: baseList.status,
              is_autosave_draft: baseList.isAutosaveDraft,
              activated_at: baseList.activatedAt,
              is_editing: baseList.isEditing,
              editing_target_list_id: baseList.editingTargetListId,
              created_at: baseList.createdAt,
              updated_at: baseList.updatedAt,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: catalogItem.id,
              list_id: catalogItem.listId,
              source: catalogItem.source,
              source_product_id: catalogItem.sourceProductId,
              name_snapshot: catalogItem.nameSnapshot,
              thumbnail_snapshot: catalogItem.thumbnailSnapshot,
              price_snapshot: catalogItem.priceSnapshot,
              unit_size_snapshot: catalogItem.unitSizeSnapshot,
              unit_format_snapshot: catalogItem.unitFormatSnapshot,
              unit_price_per_unit_snapshot:
                catalogItem.unitPricePerUnitSnapshot,
              is_approx_size_snapshot: catalogItem.isApproxSizeSnapshot,
              qty: catalogItem.qty,
              checked: catalogItem.checked,
              created_at: catalogItem.createdAt,
              updated_at: catalogItem.updatedAt,
            },
          ],
        }),
    };

    const repository = new PostgresListRepository(pool);

    await expect(repository.findById(baseList.id)).resolves.toEqual(list);
  });


  it("preserves milliseconds when postgres rows return Date objects", async () => {
    const updatedAt = new Date("2026-02-14T23:18:18.034Z");
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: baseList.id,
              owner_user_id: baseList.ownerUserId,
              title: baseList.title,
              status: baseList.status,
              is_autosave_draft: baseList.isAutosaveDraft,
              activated_at: baseList.activatedAt,
              is_editing: baseList.isEditing,
              editing_target_list_id: baseList.editingTargetListId,
              created_at: baseList.createdAt,
              updated_at: updatedAt,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }),
    };

    const repository = new PostgresListRepository(pool);

    const persisted = await repository.findById(baseList.id);
    expect(persisted?.updatedAt.toISOString()).toBe("2026-02-14T23:18:18.034Z");
  });

  it("returns null when list is missing", async () => {
    const pool = {
      query: vi.fn().mockResolvedValueOnce({ rows: [] }),
    };

    const repository = new PostgresListRepository(pool);

    await expect(repository.findById("missing")).resolves.toBeNull();
  });

  it("lists by owner with items", async () => {
    const pool = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: "list-1",
              owner_user_id: "user-1",
              title: "Weekly groceries",
              status: "DRAFT",
              is_autosave_draft: false,
              activated_at: baseList.activatedAt,
              is_editing: false,
              editing_target_list_id: null,
              created_at: baseList.createdAt,
              updated_at: baseList.updatedAt,
            },
            {
              id: "list-2",
              owner_user_id: "user-1",
              title: "Party",
              status: "ACTIVE",
              is_autosave_draft: false,
              activated_at: null,
              is_editing: true,
              editing_target_list_id: null,
              created_at: baseList.createdAt,
              updated_at: baseList.updatedAt,
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: catalogItem.id,
              list_id: catalogItem.listId,
              source: catalogItem.source,
              source_product_id: catalogItem.sourceProductId,
              name_snapshot: catalogItem.nameSnapshot,
              thumbnail_snapshot: catalogItem.thumbnailSnapshot,
              price_snapshot: catalogItem.priceSnapshot,
              unit_size_snapshot: catalogItem.unitSizeSnapshot,
              unit_format_snapshot: catalogItem.unitFormatSnapshot,
              unit_price_per_unit_snapshot:
                catalogItem.unitPricePerUnitSnapshot,
              is_approx_size_snapshot: catalogItem.isApproxSizeSnapshot,
              qty: catalogItem.qty,
              checked: catalogItem.checked,
              created_at: catalogItem.createdAt,
              updated_at: catalogItem.updatedAt,
            },
            {
              id: catalogItemTwo.id,
              list_id: catalogItemTwo.listId,
              source: catalogItemTwo.source,
              source_product_id: catalogItemTwo.sourceProductId,
              name_snapshot: catalogItemTwo.nameSnapshot,
              thumbnail_snapshot: catalogItemTwo.thumbnailSnapshot,
              price_snapshot: catalogItemTwo.priceSnapshot,
              unit_size_snapshot: catalogItemTwo.unitSizeSnapshot,
              unit_format_snapshot: catalogItemTwo.unitFormatSnapshot,
              unit_price_per_unit_snapshot:
                catalogItemTwo.unitPricePerUnitSnapshot,
              is_approx_size_snapshot: catalogItemTwo.isApproxSizeSnapshot,
              qty: catalogItemTwo.qty,
              checked: catalogItemTwo.checked,
              created_at: catalogItemTwo.createdAt,
              updated_at: catalogItemTwo.updatedAt,
            },
          ],
        }),
    };

    const repository = new PostgresListRepository(pool);

    await expect(repository.listByOwner("user-1")).resolves.toEqual([
      list,
      {
        id: "list-2",
        ownerUserId: "user-1",
        title: "Party",
        isAutosaveDraft: false,
        status: "ACTIVE",
        activatedAt: undefined,
        isEditing: true,
        editingTargetListId: null,
        createdAt: baseList.createdAt,
        updatedAt: baseList.updatedAt,
        items: [
          {
            id: catalogItemTwo.id,
            listId: catalogItemTwo.listId,
            kind: "catalog",
            source: catalogItemTwo.source,
            sourceProductId: catalogItemTwo.sourceProductId,
            nameSnapshot: catalogItemTwo.nameSnapshot,
            thumbnailSnapshot: catalogItemTwo.thumbnailSnapshot,
            priceSnapshot: catalogItemTwo.priceSnapshot,
            unitSizeSnapshot: catalogItemTwo.unitSizeSnapshot,
            unitFormatSnapshot: catalogItemTwo.unitFormatSnapshot,
            unitPricePerUnitSnapshot: catalogItemTwo.unitPricePerUnitSnapshot,
            isApproxSizeSnapshot: catalogItemTwo.isApproxSizeSnapshot,
            qty: catalogItemTwo.qty,
            checked: catalogItemTwo.checked,
            createdAt: catalogItemTwo.createdAt,
            updatedAt: catalogItemTwo.updatedAt,
          },
        ],
      },
    ]);
  });

  it("saves a list and items in a transaction", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const repository = new PostgresListRepository(pool);

    await repository.save(list);

    expect(pool.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      "INSERT INTO lists (id, owner_user_id, title, status, is_autosave_draft, activated_at, is_editing, editing_target_list_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) ON CONFLICT (id) DO UPDATE SET owner_user_id = EXCLUDED.owner_user_id, title = EXCLUDED.title, status = EXCLUDED.status, is_autosave_draft = EXCLUDED.is_autosave_draft, activated_at = EXCLUDED.activated_at, is_editing = EXCLUDED.is_editing, editing_target_list_id = EXCLUDED.editing_target_list_id, created_at = EXCLUDED.created_at, updated_at = EXCLUDED.updated_at",
      [
        list.id,
        list.ownerUserId,
        list.title,
        list.status,
        list.isAutosaveDraft,
        list.activatedAt ?? null,
        list.isEditing,
        list.editingTargetListId,
        list.createdAt,
        list.updatedAt,
      ],
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      "DELETE FROM list_items WHERE list_id = $1",
      [list.id],
    );
    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO list_items (id, list_id, source, source_product_id, name_snapshot, thumbnail_snapshot, price_snapshot, unit_size_snapshot, unit_format_snapshot, unit_price_per_unit_snapshot, is_approx_size_snapshot, qty, checked, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)",
      [
        catalogItem.id,
        catalogItem.listId,
        catalogItem.source,
        catalogItem.sourceProductId,
        catalogItem.nameSnapshot,
        catalogItem.thumbnailSnapshot,
        catalogItem.priceSnapshot,
        catalogItem.unitSizeSnapshot,
        catalogItem.unitFormatSnapshot,
        catalogItem.unitPricePerUnitSnapshot,
        catalogItem.isApproxSizeSnapshot,
        catalogItem.qty,
        catalogItem.checked,
        catalogItem.createdAt,
        catalogItem.updatedAt,
      ],
    );
    expect(pool.query).toHaveBeenLastCalledWith("COMMIT");
  });

  it("deletes list items and list in a transaction", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };

    const repository = new PostgresListRepository(pool);

    await repository.deleteById("list-1");

    expect(pool.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      "DELETE FROM list_items WHERE list_id = $1",
      ["list-1"],
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      "DELETE FROM lists WHERE id = $1",
      ["list-1"],
    );
    expect(pool.query).toHaveBeenLastCalledWith("COMMIT");
  });
});
