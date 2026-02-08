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
      name: "Leche",
      qty: 2,
      checked: false,
      source: "mercadona",
      sourceProductId: "item-1",
    },
    {
      id: "item-2",
      name: "Pan",
      qty: 1,
      checked: false,
      source: "mercadona",
      sourceProductId: "item-2",
    },
  ],
};

describe("LocalDraftSyncService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("devuelve null si no hay borrador local", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>();
    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("guarda el autosave remoto y limpia el borrador local", async () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Compra semanal",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toEqual({
      listId: "autosave-1",
      itemsCreated: 2,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          title: "Compra semanal",
          items: SAMPLE_DRAFT.items,
        }),
      }),
    );
    expect(localStorage.getItem("lists.localDraft")).toBeNull();
  });

  it("incluye items de catálogo en el autosave", async () => {
    const catalogDraft: AutosaveDraftInput = {
      title: "Compra catálogo",
      items: [
        {
          id: "product-1",
          name: "Aceite",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "product-1",
          thumbnail: "https://example.com/aceite.png",
          price: 4.2,
        },
      ],
    };
    localStorage.setItem("lists.localDraft", JSON.stringify(catalogDraft));
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Compra catálogo",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toEqual({
      listId: "autosave-1",
      itemsCreated: 1,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(catalogDraft),
      }),
    );
  });

  it("mantiene el borrador local si falla el autosave", async () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
        text: async () => "Error",
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).rejects.toThrow(
      "Unable to save autosave.",
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
        json: async () => ({
          id: "autosave-1",
          title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(syncLocalDraftToRemoteList()).resolves.toEqual({
      listId: "autosave-1",
      itemsCreated: 2,
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          title: UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
          items: SAMPLE_DRAFT.items,
        }),
      }),
    );
  });
});
