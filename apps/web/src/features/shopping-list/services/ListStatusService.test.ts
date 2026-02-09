import { beforeEach, describe, expect, it, vi } from "vitest";
import { activateList } from "./ListStatusService";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import { syncLocalDraftToRemoteList } from "./LocalDraftSyncService";

vi.mock("./LocalDraftSyncService", () => ({
  syncLocalDraftToRemoteList: vi.fn(),
}));

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("ListStatusService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("activa un LOCAL_DRAFT creando la lista y actualizando el status", async () => {
    vi.mocked(syncLocalDraftToRemoteList).mockResolvedValue({
      listId: "list-1",
      itemsCreated: 2,
    });

    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-1",
        status: LIST_STATUS.ACTIVE,
        updatedAt: "2024-02-01T10:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      activateList({ status: LIST_STATUS.LOCAL_DRAFT, listId: null }),
    ).resolves.toEqual({
      id: "list-1",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-01T10:00:00.000Z",
    });

    expect(syncLocalDraftToRemoteList).toHaveBeenCalledTimes(1);
    expect(syncLocalDraftToRemoteList).toHaveBeenCalledWith({
      clearLocal: true,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-1/activate",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: LIST_STATUS.ACTIVE }),
      }),
    );
  });

  it("activa un DRAFT existente usando el listId", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({
        id: "list-2",
        status: LIST_STATUS.ACTIVE,
        updatedAt: "2024-02-02T10:00:00.000Z",
      }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      activateList({ status: LIST_STATUS.DRAFT, listId: "list-2" }),
    ).resolves.toEqual({
      id: "list-2",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-02T10:00:00.000Z",
    });

    expect(syncLocalDraftToRemoteList).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/list-2/activate",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: LIST_STATUS.ACTIVE }),
      }),
    );
  });

  it("lanza un error si falta el listId al activar un DRAFT", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >();

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      activateList({ status: LIST_STATUS.DRAFT, listId: null }),
    ).rejects.toThrow("Unable to activate list without id");

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
