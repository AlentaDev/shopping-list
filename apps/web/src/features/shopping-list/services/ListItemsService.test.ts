import { beforeEach, describe, expect, it, vi } from "vitest";
import { deleteListItem } from "./ListItemsService";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListItemsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("elimina un item de la lista remota", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteListItem({ listId: "list-1", itemId: "item-1" }),
    ).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-1/items/item-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("lanza un error si la API no responde ok", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteListItem({ listId: "list-1", itemId: "item-9" }),
    ).rejects.toThrow("Unable to delete list item.");
  });
});
