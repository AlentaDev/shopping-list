import { beforeEach, describe, expect, it, vi } from "vitest";
import { syncLocalDraftToRemoteList } from "./LocalDraftSyncService";
import type { AutosaveDraftInput } from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

const SAMPLE_DRAFT: AutosaveDraftInput = {
  title: "Compra semanal",
  items: [
    {
      id: "item-1",
      kind: "manual",
      name: "Leche",
      qty: 2,
      checked: false,
      note: "Sin lactosa",
    },
    {
      id: "item-2",
      kind: "manual",
      name: "Pan",
      qty: 1,
      checked: false,
      note: null,
    },
  ],
};

describe("LocalDraftSyncService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  it("devuelve null si no hay borrador local", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("crea la lista remota y sus items, y limpia el borrador local", async () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "list-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "item-remote-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "item-remote-2" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toEqual({
      listId: "list-1",
      itemsCreated: 2,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/lists",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ title: "Compra semanal" }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/lists/list-1/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Leche",
          qty: 2,
          checked: false,
          note: "Sin lactosa",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/lists/list-1/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Pan", qty: 1, checked: false }),
      }),
    );
    expect(localStorage.getItem("lists.localDraft")).toBeNull();
  });

  it("mantiene el borrador local si falla la creación de la lista", async () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).rejects.toThrow(
      "Unable to create list",
    );
    expect(localStorage.getItem("lists.localDraft")).toBe(
      JSON.stringify(SAMPLE_DRAFT),
    );
  });

  it("mantiene el borrador local si falla la creación de items", async () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "list-1" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).rejects.toThrow(
      "Unable to create list items",
    );
    expect(localStorage.getItem("lists.localDraft")).toBe(
      JSON.stringify(SAMPLE_DRAFT),
    );
  });

  it("usa el título por defecto si el borrador local no tiene título", async () => {
    localStorage.setItem(
      "lists.localDraft",
      JSON.stringify({
        ...SAMPLE_DRAFT,
        title: "   ",
      }),
    );
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "list-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "item-remote-1" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "item-remote-2" }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toEqual({
      listId: "list-1",
      itemsCreated: 2,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/lists",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
        }),
      }),
    );
  });
});
