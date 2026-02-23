import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
import {
  activateList,
  completeList,
  createList,
  deleteList,
  reuseList,
  getListDetail,
  getLists,
  startListEditing,
} from "./ListsService";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import { UI_TEXT } from "@src/shared/constants/ui";

vi.mock("@src/shared/services/http/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
}));

const fetchWithAuthMock = vi.mocked(fetchWithAuth);

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/lists");
  });

  it("throws when lists request fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/lists/list-2");
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
      "/api/lists/list-3/reuse",
      expect.objectContaining({ method: "POST", retryOnAuth401: true })
    );
  });

  it("deletes lists with DELETE", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(deleteList("list-4")).resolves.toBeUndefined();

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
      "/api/lists/list-4",
      expect.objectContaining({ method: "DELETE", retryOnAuth401: true })
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(activateList("list-5")).resolves.toEqual({
      id: "list-5",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-04T10:00:00.000Z",
    });

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
      "/api/lists/list-5/activate",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: LIST_STATUS.ACTIVE }),
      })
    );
  });

  it("inicia edición de lista activa con PATCH y guarda baseUpdatedAt del draft", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        ok: true,
        updatedAt: "2024-06-01T09:00:00.000Z",
        autosaveUpdatedAt: "2024-06-01T09:00:05.000Z",
      }),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(startListEditing("list-8")).resolves.toBeUndefined();

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
      "/api/lists/list-8/editing",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEditing: true }),
        retryOnAuth401: true,
      })
    );


    expect(localStorage.getItem("lists.localDraftSync")).toBe(
      JSON.stringify({ baseUpdatedAt: "2024-06-01T09:00:05.000Z" }),
    );
    expect(localStorage.getItem("lists.editSession")).toBe(
      JSON.stringify({ listId: "list-8", isEditing: true }),
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(
      completeList("list-6", { checkedItemIds: ["item-1", "item-2"] })
    ).resolves.toBeUndefined();

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(createList()).resolves.toEqual({
      id: "list-7",
      title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
      updatedAt: "2024-02-06T10:00:00.000Z",
      activatedAt: null,
      itemCount: 0,
      isEditing: false,
      status: LIST_STATUS.DRAFT,
    });

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(createList("Mercado")).rejects.toThrow(
      "Unable to create list."
    );
  });
});
