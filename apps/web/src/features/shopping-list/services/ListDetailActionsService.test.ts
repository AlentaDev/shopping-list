import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
import {
  deleteList,
  reuseList,
  startListEditing,
} from "./ListDetailActionsService";

vi.mock("@src/shared/services/http/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
}));

const fetchWithAuthMock = vi.mocked(fetchWithAuth);

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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(startListEditing("list-1")).resolves.toBeUndefined();

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(deleteList("list-3")).resolves.toBeUndefined();

    expect(fetchWithAuthMock).toHaveBeenCalledWith(
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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

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

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(
      deleteList("list-11", { errorMessage: "No delete" }),
    ).rejects.toThrow("No delete");
  });
});
