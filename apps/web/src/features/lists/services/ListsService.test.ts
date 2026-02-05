import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activateList,
  completeList,
  createList,
  deleteList,
  reuseList,
  getListDetail,
  getLists,
} from "./ListsService";
import { LIST_STATUS } from "./listActions";
import { UI_TEXT } from "@src/shared/constants/ui";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("fetches and adapts list collection", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        lists: [
          {
            id: "list-1",
            title: "Semanal",
            updatedAt: "2024-02-01T10:00:00.000Z",
            activatedAt: "2024-02-01T09:00:00.000Z",
            itemCount: 3,
            isEditing: false,
            status: LIST_STATUS.ACTIVE,
          },
        ],
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getLists()).resolves.toEqual({
      lists: [
        {
          id: "list-1",
          title: "Semanal",
          updatedAt: "2024-02-01T10:00:00.000Z",
          activatedAt: "2024-02-01T09:00:00.000Z",
          itemCount: 3,
          isEditing: false,
          status: LIST_STATUS.ACTIVE,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/lists");
  });

  it("throws when lists request fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getLists()).rejects.toThrow("Unable to load lists.");
  });

  it("fetches list detail", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-2",
        title: "Cena",
        updatedAt: "2024-02-02T10:00:00.000Z",
        activatedAt: null,
        itemCount: 0,
        isEditing: false,
        items: [],
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getListDetail("list-2")).resolves.toEqual({
      id: "list-2",
      title: "Cena",
      updatedAt: "2024-02-02T10:00:00.000Z",
      activatedAt: null,
      itemCount: 0,
      isEditing: false,
      items: [],
      status: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/lists/list-2");
  });

  it("reuses lists with POST", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-3",
        title: "Duplicada",
        updatedAt: "2024-02-03T10:00:00.000Z",
        activatedAt: null,
        itemCount: 0,
        isEditing: false,
        items: [],
        status: LIST_STATUS.DRAFT,
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(reuseList("list-3")).resolves.toEqual({
      id: "list-3",
      title: "Duplicada",
      updatedAt: "2024-02-03T10:00:00.000Z",
      activatedAt: null,
      itemCount: 0,
      isEditing: false,
      items: [],
      status: LIST_STATUS.DRAFT,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-3/reuse",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("deletes lists with DELETE", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteList("list-4")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-4",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("activates list with PATCH", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-5",
        status: LIST_STATUS.ACTIVE,
        updatedAt: "2024-02-04T10:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(activateList("list-5")).resolves.toEqual({
      id: "list-5",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-04T10:00:00.000Z",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-5/status",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: LIST_STATUS.ACTIVE }),
      })
    );
  });

  it("completes list with POST", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-6",
        status: LIST_STATUS.COMPLETED,
        updatedAt: "2024-02-05T10:00:00.000Z",
        items: [],
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      completeList("list-6", { checkedItemIds: ["item-1", "item-2"] })
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-6/complete",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkedItemIds: ["item-1", "item-2"] }),
      })
    );
  });

  it("creates list with default title", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-7",
        title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
        updatedAt: "2024-02-06T10:00:00.000Z",
        activatedAt: null,
        itemCount: 0,
        isEditing: false,
        status: LIST_STATUS.DRAFT,
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(createList()).resolves.toEqual({
      id: "list-7",
      title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
      updatedAt: "2024-02-06T10:00:00.000Z",
      activatedAt: null,
      itemCount: 0,
      isEditing: false,
      status: LIST_STATUS.DRAFT,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE }),
      })
    );
  });

  it("throws when list creation fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(createList("Mercado")).rejects.toThrow(
      "Unable to create list."
    );
  });
});
