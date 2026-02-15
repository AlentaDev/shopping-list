import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
  AutosaveConflictError,
  createAutosaveScheduler,
  getAutosave,
  loadLocalDraft,
  putAutosave,
  saveLocalDraft,
  deleteAutosave,
} from "./AutosaveService";
import type { AutosaveDraftInput } from "./types";

const SAMPLE_DRAFT: AutosaveDraftInput = {
  title: "Lista semanal",
  items: [
    {
      id: "item-1",
      kind: "catalog",
      name: "Leche",
      qty: 2,
      checked: false,
      source: "mercadona",
      sourceProductId: "item-1",
    },
  ],
};

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
  status?: number;
  statusText?: string;
  text?: () => Promise<string>;
};

describe("AutosaveService", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("guarda el borrador local en localStorage", () => {
    saveLocalDraft(SAMPLE_DRAFT);

    const stored = localStorage.getItem("lists.localDraft");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? "{}") as AutosaveDraftInput & {
      updatedAt?: string;
    };

    expect(parsed).toMatchObject(SAMPLE_DRAFT);
    expect(parsed.updatedAt).toEqual(expect.any(String));
  });

  it("recupera el borrador local desde localStorage", () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));

    expect(loadLocalDraft()).toMatchObject(SAMPLE_DRAFT);
    expect(loadLocalDraft()?.updatedAt).toEqual(expect.any(String));
  });

  it("devuelve null si el borrador local es inválido", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    localStorage.setItem("lists.localDraft", "no-json");

    expect(loadLocalDraft()).toBeNull();
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("devuelve null si no hay autosave en servidor", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        status: 204,
        json: async () => null,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(getAutosave()).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("envía el borrador al endpoint de autosave", async () => {
    const responsePayload = {
      id: "autosave-1",
      title: "Lista semanal",
      updatedAt: "2024-01-01T00:00:00.000Z",
    };
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => responsePayload,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(putAutosave(SAMPLE_DRAFT)).resolves.toEqual(responsePayload);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: expect.stringMatching(/"baseUpdatedAt":".+"/),
      })
    );
  });



  it("envía baseUpdatedAt con fecha ISO cuando no hay metadata previa y no hay remoto", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-02-01T10:00:00.000Z"));

    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-02-01T10:00:01.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await putAutosave(SAMPLE_DRAFT);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          ...SAMPLE_DRAFT,
          baseUpdatedAt: "2024-02-01T10:00:00.000Z",
        }),
      })
    );
  });

  it("usa updatedAt remoto como baseUpdatedAt cuando no hay metadata local", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          items: [],
          updatedAt: "2024-02-01T10:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-02-01T10:00:01.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await putAutosave(SAMPLE_DRAFT);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          ...SAMPLE_DRAFT,
          baseUpdatedAt: "2024-02-01T10:00:00.000Z",
        }),
      })
    );
  });


  it("tolera respuesta null al guardar autosave remoto", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => null,
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(putAutosave(SAMPLE_DRAFT)).resolves.toEqual({
      id: "",
      title: "",
      updatedAt: "",
    });
  });

  it("usa el updatedAt remoto como baseUpdatedAt en autosaves siguientes", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          items: [],
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-01-01T00:00:01.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await getAutosave();
    await putAutosave(SAMPLE_DRAFT);

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/lists/autosave",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          ...SAMPLE_DRAFT,
          baseUpdatedAt: "2024-01-01T00:00:00.000Z",
        }),
      })
    );
    expect(localStorage.getItem("lists.localDraftSync")).toBe(
      JSON.stringify({
        baseUpdatedAt: "2024-01-01T00:00:01.000Z",
      })
    );
  });

  it("registra el error cuando el autosave remoto falla", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        status: 400,
        statusText: "Bad Request",
        json: async () => ({}),
        text: async () => "invalid payload",
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(putAutosave(SAMPLE_DRAFT)).rejects.toThrow(
      "Unable to save autosave."
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "Autosave remoto falló.",
      expect.objectContaining({
        status: 400,
        statusText: "Bad Request",
        responseBody: "invalid payload",
        draft: SAMPLE_DRAFT,
      })
    );

    warnSpy.mockRestore();
  });

  it("reintenta autosave tras refrescar sesión cuando el primer intento devuelve 401", async () => {
    let hasFailedPut = false;

    const fetchMock = vi
      .fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>()
      .mockImplementation(async (input, init) => {
        if (input === "/api/lists/autosave" && !init?.method) {
          return {
            ok: true,
            status: 204,
            json: async () => null,
          };
        }

        if (
          input === "/api/lists/autosave" &&
          init?.method === "PUT" &&
          !hasFailedPut
        ) {
          hasFailedPut = true;
          return {
            ok: false,
            status: 401,
            statusText: "Unauthorized",
            json: async () => ({}),
            text: async () => "unauthorized",
          };
        }

        if (input === "/api/auth/refresh") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "autosave-1",
            title: "Lista semanal",
            updatedAt: "2024-01-01T00:00:01.000Z",
          }),
        };
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(putAutosave(SAMPLE_DRAFT)).resolves.toMatchObject({
      id: "autosave-1",
      title: "Lista semanal",
      updatedAt: "2024-01-01T00:00:01.000Z",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
  });

  it("refresca sesión antes del autosave cuando el refresh previo está próximo a expirar", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T10:01:00.000Z"));
    localStorage.setItem("auth.sessionRefreshedAt", String(Date.now() - 56_000));

    const fetchMock = vi
      .fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>()
      .mockImplementation(async (input, init) => {
        if (input === "/api/lists/autosave" && !init?.method) {
          return {
            ok: true,
            status: 204,
            json: async () => null,
          };
        }

        if (input === "/api/auth/refresh") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ ok: true }),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: "autosave-1",
            title: "Lista semanal",
            updatedAt: "2024-01-01T10:01:00.000Z",
          }),
        };
      });

    vi.stubGlobal("fetch", fetchMock);

    await expect(putAutosave(SAMPLE_DRAFT)).resolves.toMatchObject({
      id: "autosave-1",
      title: "Lista semanal",
      updatedAt: "2024-01-01T10:01:00.000Z",
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/auth/refresh",
      expect.objectContaining({ method: "POST", credentials: "include" }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" }),
    );
    expect(
      fetchMock.mock.calls.filter(
        ([input, init]) => input === "/api/lists/autosave" && init?.method === "PUT",
      ),
    ).toHaveLength(1);
  });


  it("lanza conflicto estructurado sin reintento automático cuando recibe 409", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          items: [],
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({}),
        text: async () =>
          JSON.stringify({
            error: "autosave_version_conflict",
            remoteUpdatedAt: "2024-01-01T00:00:02.000Z",
          }),
      });

    vi.stubGlobal("fetch", fetchMock);

    const conflictError = await putAutosave(SAMPLE_DRAFT).catch(
      (error) => error as AutosaveConflictError,
    );

    expect(conflictError).toBeInstanceOf(AutosaveConflictError);
    expect(conflictError).toMatchObject({
      remoteUpdatedAt: "2024-01-01T00:00:02.000Z",
      metadata: {
        error: "autosave_version_conflict",
      },
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT" }),
    );
  });

  it("lanza error de conflicto cuando el autosave responde 409", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        status: 409,
        statusText: "Conflict",
        json: async () => ({}),
        text: async () => "conflict",
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(putAutosave(SAMPLE_DRAFT)).rejects.toBeInstanceOf(
      AutosaveConflictError
    );
  });

  it("elimina el autosave del servidor", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({}),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteAutosave()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "DELETE", credentials: "include" })
    );
  });

  it("debouncea el autosave remoto y guarda localmente al momento", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const scheduler = createAutosaveScheduler();

    scheduler.schedule(SAMPLE_DRAFT);

    const stored = localStorage.getItem("lists.localDraft");
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? "{}") as AutosaveDraftInput & {
      updatedAt?: string;
    };
    expect(parsed).toMatchObject(SAMPLE_DRAFT);
    expect(parsed.updatedAt).toEqual(expect.any(String));
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT", credentials: "include" })
    );
  });

  it("omite el guardado local cuando persistLocal es false", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const scheduler = createAutosaveScheduler({ persistLocal: false });

    scheduler.schedule(SAMPLE_DRAFT);

    expect(localStorage.getItem("lists.localDraft")).toBeNull();

    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({ method: "PUT", credentials: "include" })
    );
  });

  it("usa el último borrador si hay cambios rápidos", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const scheduler = createAutosaveScheduler();
    const secondDraft: AutosaveDraftInput = {
      title: "Lista actualizada",
      items: [
        {
          id: "item-2",
          kind: "catalog",
          name: "Pan",
          qty: 1,
          checked: false,
          source: "mercadona",
          sourceProductId: "item-2",
        },
      ],
    };

    scheduler.schedule(SAMPLE_DRAFT);
    await vi.advanceTimersByTimeAsync(1000);
    scheduler.schedule(secondDraft);
    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({
        credentials: "include",
        body: expect.any(String),
      })
    );

    const sentBody = JSON.parse(
      String(fetchMock.mock.calls[1]?.[1]?.body ?? "{}")
    ) as AutosaveDraftInput & { baseUpdatedAt?: string };

    expect(sentBody).toEqual(
      expect.objectContaining({
        ...secondDraft,
        baseUpdatedAt: expect.any(String),
      })
    );
  });
  it("guarda sourceTabId en metadata de sync cuando hay autosave remoto", async () => {
    const fetchMock = vi
      .fn<(input: RequestInfo) => Promise<FetchResponse>>()
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: "autosave-1",
          title: "Lista semanal",
          updatedAt: "2024-03-01T10:00:01.000Z",
        }),
      });

    vi.stubGlobal("fetch", fetchMock);

    await putAutosave(SAMPLE_DRAFT, { sourceTabId: "tab-a" });

    expect(localStorage.getItem("lists.localDraftSync")).toBe(
      JSON.stringify({
        baseUpdatedAt: "2024-03-01T10:00:01.000Z",
        sourceTabId: "tab-a",
      }),
    );
  });

});
