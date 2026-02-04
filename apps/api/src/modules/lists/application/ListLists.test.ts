import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import type { ListRepository } from "./ports.js";
import { ListLists } from "./ListLists.js";

const createList = (overrides: Partial<List> = {}): List => ({
  id: "list-1",
  ownerUserId: "user-1",
  title: "Groceries",
  isAutosaveDraft: false,
  status: "ACTIVE",
  activatedAt: undefined,
  isEditing: false,
  items: [],
  createdAt: new Date("2024-01-01T10:00:00.000Z"),
  updatedAt: new Date("2024-01-02T10:00:00.000Z"),
  ...overrides,
});

describe("ListLists", () => {
  it("filters lists by status when provided", async () => {
    const completedList = createList({
      id: "list-completed",
      status: "COMPLETED",
      updatedAt: new Date("2024-02-01T10:00:00.000Z"),
    });
    const activeList = createList({
      id: "list-active",
      status: "ACTIVE",
      updatedAt: new Date("2024-02-02T10:00:00.000Z"),
    });
    const listRepository: ListRepository = {
      listByOwner: vi
        .fn(async () => [completedList, activeList] as List[]),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1", {
      status: "COMPLETED",
    });

    expect(listRepository.listByOwner).toHaveBeenCalledWith("user-1");
    expect(result.lists).toEqual([
      {
        id: "list-completed",
        title: "Groceries",
        status: "COMPLETED",
        itemCount: 0,
        activatedAt: null,
        isEditing: false,
        updatedAt: "2024-02-01T10:00:00.000Z",
      },
    ]);
  });

  it("returns all lists when no status filter is provided", async () => {
    const firstList = createList({
      id: "list-1",
      status: "ACTIVE",
    });
    const secondList = createList({
      id: "list-2",
      status: "COMPLETED",
    });
    const listRepository: ListRepository = {
      listByOwner: vi.fn(async () => [firstList, secondList] as List[]),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1");

    expect(listRepository.listByOwner).toHaveBeenCalledWith("user-1");
    expect(result.lists).toEqual([
      {
        id: "list-1",
        title: "Groceries",
        status: "ACTIVE",
        itemCount: 0,
        activatedAt: null,
        isEditing: false,
        updatedAt: "2024-01-02T10:00:00.000Z",
      },
      {
        id: "list-2",
        title: "Groceries",
        status: "COMPLETED",
        itemCount: 0,
        activatedAt: null,
        isEditing: false,
        updatedAt: "2024-01-02T10:00:00.000Z",
      },
    ]);
  });
});
