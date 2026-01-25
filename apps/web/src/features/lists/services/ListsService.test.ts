import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteList,
  duplicateList,
  getListDetail,
  getLists,
} from "./ListsService";
import { LIST_STATUS } from "./listActions";

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
        items: [],
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getListDetail("list-2")).resolves.toEqual({
      id: "list-2",
      title: "Cena",
      updatedAt: "2024-02-02T10:00:00.000Z",
      items: [],
      status: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/lists/list-2");
  });

  it("duplicates lists with POST", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-3",
        title: "Duplicada",
        updatedAt: "2024-02-03T10:00:00.000Z",
        items: [],
        status: LIST_STATUS.DRAFT,
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(duplicateList("list-3")).resolves.toEqual({
      id: "list-3",
      title: "Duplicada",
      updatedAt: "2024-02-03T10:00:00.000Z",
      items: [],
      status: LIST_STATUS.DRAFT,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-3/duplicate",
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
});
