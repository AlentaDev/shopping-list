import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import {
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
      kind: "manual",
      name: "Leche",
      qty: 2,
      checked: false,
      note: "Sin lactosa",
    },
  ],
};

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
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

    expect(localStorage.getItem("lists.localDraft")).toBe(
      JSON.stringify(SAMPLE_DRAFT)
    );
  });

  it("recupera el borrador local desde localStorage", () => {
    localStorage.setItem("lists.localDraft", JSON.stringify(SAMPLE_DRAFT));

    expect(loadLocalDraft()).toEqual(SAMPLE_DRAFT);
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
        body: JSON.stringify(SAMPLE_DRAFT),
      })
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

    expect(localStorage.getItem("lists.localDraft")).toBe(
      JSON.stringify(SAMPLE_DRAFT)
    );
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
          kind: "manual",
          name: "Pan",
          qty: 1,
          checked: false,
          note: null,
        },
      ],
    };

    scheduler.schedule(SAMPLE_DRAFT);
    await vi.advanceTimersByTimeAsync(1000);
    scheduler.schedule(secondDraft);
    await vi.advanceTimersByTimeAsync(1500);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/lists/autosave",
      expect.objectContaining({
        credentials: "include",
        body: JSON.stringify(secondDraft),
      })
    );
  });
});
