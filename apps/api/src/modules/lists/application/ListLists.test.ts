import { describe, expect, it, vi } from "vitest";
import type { List } from "../domain/list.js";
import type { ListRepository } from "./ports.js";
import { ListLists } from "./ListLists.js";

const createList = (overrides: Partial<List> = {}): List => ({
  id: "list-1",
  ownerUserId: "user-1",
  title: "Groceries",
  providerId: "provider-mercadona",
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
  it("filters draft lists by explicit status", async () => {
    const draftList = createList({
      id: "list-draft",
      status: "DRAFT",
      updatedAt: new Date("2024-02-01T10:00:00.000Z"),
    });
    const activeList = createList({
      id: "list-active",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-02T10:00:00.000Z"),
      updatedAt: new Date("2024-02-02T10:00:00.000Z"),
    });
    const listRepository: ListRepository = {
      listByOwner: vi.fn(async () => [draftList, activeList] as List[]),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1", {
      status: "DRAFT",
    });

    expect(result.lists.map((list) => list.id)).toEqual(["list-draft"]);
  });

  it("filters active lists by explicit status", async () => {
    const activeList = createList({
      id: "list-active",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-02T10:00:00.000Z"),
      updatedAt: new Date("2024-02-02T10:00:00.000Z"),
    });
    const completedList = createList({
      id: "list-completed",
      status: "COMPLETED",
      updatedAt: new Date("2024-02-01T10:00:00.000Z"),
    });
    const listRepository: ListRepository = {
      listByOwner: vi.fn(async () => [activeList, completedList] as List[]),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1", {
      status: "ACTIVE",
    });

    expect(result.lists.map((list) => list.id)).toEqual(["list-active"]);
  });

  it("filters lists by status when provided", async () => {
    const completedList = createList({
      id: "list-completed",
      status: "COMPLETED",
      updatedAt: new Date("2024-02-01T10:00:00.000Z"),
    });
    const activeList = createList({
      id: "list-active",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-02T10:00:00.000Z"),
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
        providerId: "provider-mercadona",
        provider: {
          slug: "mercadona",
          displayName: "Mercadona",
        },
      },
    ]);
  });

  it("excludes drafts and autosave drafts when no status filter is provided", async () => {
    const draftList = createList({
      id: "list-draft",
      status: "DRAFT",
      updatedAt: new Date("2024-02-01T10:00:00.000Z"),
    });
    const autosaveDraft = createList({
      id: "list-autosave",
      status: "DRAFT",
      isAutosaveDraft: true,
      updatedAt: new Date("2024-02-02T10:00:00.000Z"),
    });
    const activeList = createList({
      id: "list-active",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-03T10:00:00.000Z"),
      updatedAt: new Date("2024-02-03T11:00:00.000Z"),
    });
    const completedList = createList({
      id: "list-completed",
      status: "COMPLETED",
      updatedAt: new Date("2024-02-04T10:00:00.000Z"),
    });
    const listRepository: ListRepository = {
      listByOwner: vi.fn(
        async () => [draftList, autosaveDraft, activeList, completedList] as List[],
      ),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1");

    expect(listRepository.listByOwner).toHaveBeenCalledWith("user-1");
    expect(result.lists).toEqual([
      {
        id: "list-active",
        title: "Groceries",
        status: "ACTIVE",
        itemCount: 0,
        activatedAt: "2024-02-03T10:00:00.000Z",
        isEditing: false,
        updatedAt: "2024-02-03T11:00:00.000Z",
        providerId: "provider-mercadona",
        provider: {
          slug: "mercadona",
          displayName: "Mercadona",
        },
      },
      {
        id: "list-completed",
        title: "Groceries",
        status: "COMPLETED",
        itemCount: 0,
        activatedAt: null,
        isEditing: false,
        updatedAt: "2024-02-04T10:00:00.000Z",
        providerId: "provider-mercadona",
        provider: {
          slug: "mercadona",
          displayName: "Mercadona",
        },
      },
    ]);
  });

  it("orders actives by activatedAt and completed by updatedAt", async () => {
    const activeOlder = createList({
      id: "list-active-older",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-02T10:00:00.000Z"),
      updatedAt: new Date("2024-02-05T10:00:00.000Z"),
    });
    const activeNewer = createList({
      id: "list-active-newer",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-03T10:00:00.000Z"),
      updatedAt: new Date("2024-02-04T10:00:00.000Z"),
    });
    const completedOlder = createList({
      id: "list-completed-older",
      status: "COMPLETED",
      updatedAt: new Date("2024-02-01T10:00:00.000Z"),
    });
    const completedNewer = createList({
      id: "list-completed-newer",
      status: "COMPLETED",
      updatedAt: new Date("2024-02-06T10:00:00.000Z"),
    });
    const listRepository: ListRepository = {
      listByOwner: vi.fn(
        async () =>
          [completedOlder, activeOlder, completedNewer, activeNewer] as List[],
      ),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1");

    expect(result.lists.map((list) => list.id)).toEqual([
      "list-active-newer",
      "list-active-older",
      "list-completed-newer",
      "list-completed-older",
    ]);
  });

  it("keeps legacy behavior when repository returns lists without status", async () => {
    const legacyWithoutStatus = {
      ...createList({
        id: "legacy-list",
      }),
      status: undefined,
    } as unknown as List;
    const activeList = createList({
      id: "list-active",
      status: "ACTIVE",
      activatedAt: new Date("2024-02-03T10:00:00.000Z"),
      updatedAt: new Date("2024-02-03T11:00:00.000Z"),
    });
    const listRepository: ListRepository = {
      listByOwner: vi.fn(async () => [legacyWithoutStatus, activeList] as List[]),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1");

    expect(result.lists.map((list) => list.id)).toEqual(["list-active"]);
    expect(result.lists[0]?.providerId).toBe("provider-mercadona");
    expect(result.lists[0]?.provider).toEqual({
      slug: "mercadona",
      displayName: "Mercadona",
    });
  });

  it("falls back providerId to mercadona for legacy lists", async () => {
    const activeWithoutProvider = {
      ...createList({
        id: "list-active",
        status: "ACTIVE",
      }),
      providerId: undefined,
    } as unknown as List;
    const listRepository: ListRepository = {
      listByOwner: vi.fn(async () => [activeWithoutProvider] as List[]),
      findById: vi.fn(async () => null),
      save: vi.fn(async () => undefined),
      deleteById: vi.fn(async () => undefined),
      backfillMissingProvider: vi.fn(async () => 0),
    };
    const listLists = new ListLists(listRepository);

    const result = await listLists.execute("user-1", { status: "ACTIVE" });

    expect(result.lists).toEqual([
      expect.objectContaining({
        id: "list-active",
        providerId: "provider-mercadona",
        provider: {
          slug: "mercadona",
          displayName: "Mercadona",
        },
      }),
    ]);
  });
});
