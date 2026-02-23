// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createListTabSyncSourceId,
  LIST_TAB_SYNC_CHANNEL,
  LIST_TAB_SYNC_KEY,
  parseListTabSyncEvent,
  publishListTabSyncEvent,
  subscribeToListTabSyncEvents,
  type ListTabSyncEvent,
} from "./listTabSyncContract";

describe("listTabSyncContract", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("mantiene las claves del contrato estables", () => {
    expect(LIST_TAB_SYNC_KEY).toBe("lists.tabSync");
    expect(LIST_TAB_SYNC_CHANNEL).toBe("lists");
  });

  it("crea sourceTabId usando crypto.randomUUID cuando está disponible", () => {
    const randomUUID = vi.fn(() => "tab-uuid");
    vi.stubGlobal("crypto", { randomUUID });

    expect(createListTabSyncSourceId()).toBe("tab-uuid");
  });

  it("crea sourceTabId con fallback cuando crypto.randomUUID no existe", () => {
    const dateNowSpy = vi.spyOn(Date, "now").mockReturnValue(123456);
    vi.stubGlobal("crypto", {});

    expect(createListTabSyncSourceId()).toBe("tab-123456");

    dateNowSpy.mockRestore();
  });

  it.each([
    "list-activated",
    "list-reused",
    "list-deleted",
    "editing-started",
    "editing-finished",
    "editing-cancelled",
  ] as const)(
    "parsea eventos %s válidos",
    (type) => {
      const parsed = parseListTabSyncEvent(
        JSON.stringify({
          type,
          sourceTabId: "tab-a",
          timestamp: 123,
        }),
      );

      expect(parsed).toEqual({
        type,
        sourceTabId: "tab-a",
        timestamp: 123,
      });
    },
  );

  it("retorna null para payload inválido", () => {
    expect(parseListTabSyncEvent("{invalid")).toBeNull();
    expect(
      parseListTabSyncEvent(
        JSON.stringify({
          type: "other-event",
          sourceTabId: "tab-a",
          timestamp: 123,
        }),
      ),
    ).toBeNull();
  });

  it("publica evento en localStorage cuando BroadcastChannel no está disponible", () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;

    publishListTabSyncEvent({
      type: "list-activated",
      sourceTabId: "tab-a",
    });

    expect(localStorage.getItem(LIST_TAB_SYNC_KEY)).toEqual(
      expect.stringContaining('"type":"list-activated"'),
    );

    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("escucha eventos de otras pestañas via storage", () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;
    const onListActivated = vi.fn();

    const unsubscribe = subscribeToListTabSyncEvents({
      sourceTabId: "tab-a",
      onListActivated,
    });

    const syncEvent: ListTabSyncEvent = {
      type: "list-activated",
      sourceTabId: "tab-b",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LIST_TAB_SYNC_KEY,
        newValue: JSON.stringify(syncEvent),
      }),
    );

    expect(onListActivated).toHaveBeenCalledTimes(1);

    unsubscribe();
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("ejecuta onListDeleted al recibir un list-deleted remoto", () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;
    const onListActivated = vi.fn();
    const onListDeleted = vi.fn();

    const unsubscribe = subscribeToListTabSyncEvents({
      sourceTabId: "tab-a",
      onListActivated,
      onListDeleted,
    });

    const syncEvent: ListTabSyncEvent = {
      type: "list-deleted",
      sourceTabId: "tab-b",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LIST_TAB_SYNC_KEY,
        newValue: JSON.stringify(syncEvent),
      }),
    );

    expect(onListDeleted).toHaveBeenCalledTimes(1);
    expect(onListActivated).not.toHaveBeenCalled();

    unsubscribe();
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("ejecuta callbacks de edición al recibir eventos remotos por storage", () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;
    const onListActivated = vi.fn();
    const onEditingStarted = vi.fn();
    const onEditingFinished = vi.fn();
    const onEditingCancelled = vi.fn();

    const unsubscribe = subscribeToListTabSyncEvents({
      sourceTabId: "tab-a",
      onListActivated,
      onEditingStarted,
      onEditingFinished,
      onEditingCancelled,
    });

    const events: ListTabSyncEvent[] = [
      {
        type: "editing-started",
        sourceTabId: "tab-b",
        timestamp: Date.now(),
      },
      {
        type: "editing-finished",
        sourceTabId: "tab-b",
        timestamp: Date.now(),
      },
      {
        type: "editing-cancelled",
        sourceTabId: "tab-b",
        timestamp: Date.now(),
      },
    ];

    for (const syncEvent of events) {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: LIST_TAB_SYNC_KEY,
          newValue: JSON.stringify(syncEvent),
        }),
      );
    }

    expect(onEditingStarted).toHaveBeenCalledTimes(1);
    expect(onEditingFinished).toHaveBeenCalledTimes(1);
    expect(onEditingCancelled).toHaveBeenCalledTimes(1);
    expect(onListActivated).not.toHaveBeenCalled();

    unsubscribe();
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });


  it("ejecuta onListReused al recibir un list-reused remoto", () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;
    const onListActivated = vi.fn();
    const onListReused = vi.fn();

    const unsubscribe = subscribeToListTabSyncEvents({
      sourceTabId: "tab-a",
      onListActivated,
      onListReused,
    });

    const syncEvent: ListTabSyncEvent = {
      type: "list-reused",
      sourceTabId: "tab-b",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LIST_TAB_SYNC_KEY,
        newValue: JSON.stringify(syncEvent),
      }),
    );

    expect(onListReused).toHaveBeenCalledTimes(1);
    expect(onListActivated).not.toHaveBeenCalled();

    unsubscribe();
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("ignora eventos originados por la misma pestaña", () => {
    const originalBroadcastChannel = globalThis.BroadcastChannel;
    globalThis.BroadcastChannel = undefined as never;
    const onListActivated = vi.fn();

    const unsubscribe = subscribeToListTabSyncEvents({
      sourceTabId: "tab-a",
      onListActivated,
    });

    const syncEvent: ListTabSyncEvent = {
      type: "list-activated",
      sourceTabId: "tab-a",
      timestamp: Date.now(),
    };

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LIST_TAB_SYNC_KEY,
        newValue: JSON.stringify(syncEvent),
      }),
    );

    expect(onListActivated).not.toHaveBeenCalled();

    unsubscribe();
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });
});
