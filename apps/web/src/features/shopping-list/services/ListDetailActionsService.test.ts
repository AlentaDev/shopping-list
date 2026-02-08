import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteList,
  reuseList,
  startListEditing,
} from "./ListDetailActionsService";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListDetailActionsService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("activa la edición remota de una lista", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(startListEditing("list-1")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-1/editing",
      expect.objectContaining({
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEditing: true }),
      }),
    );
  });

  it("reusa una lista remota", async () => {
    const response = {
      id: "list-2",
      title: "Reuso",
      items: [
        {
          id: "item-1",
          name: "Pan",
          qty: 2,
          thumbnail: "https://example.com/pan.png",
          price: 1.2,
        },
        {},
      ],
    };
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => response,
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(reuseList("list-2")).resolves.toEqual({
      id: "list-2",
      title: "Reuso",
      status: undefined,
      items: [
        {
          id: "item-1",
          name: "Pan",
          category: "",
          thumbnail: "https://example.com/pan.png",
          price: 1.2,
          quantity: 2,
        },
        {
          id: "",
          name: "",
          category: "",
          thumbnail: null,
          price: null,
          quantity: 0,
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-2/reuse",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("borra una lista remota", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteList("list-3")).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-3",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("lanza un error si la edición remota falla", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      startListEditing("list-9", { errorMessage: "Boom" }),
    ).rejects.toThrow("Boom");
  });

  it("lanza un error si la reutilización remota falla", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      reuseList("list-10", { errorMessage: "No reuse" }),
    ).rejects.toThrow("No reuse");
  });

  it("lanza un error si el borrado remoto falla", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      deleteList("list-11", { errorMessage: "No delete" }),
    ).rejects.toThrow("No delete");
  });
});
