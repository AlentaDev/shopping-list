// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  LIST_TAB_SYNC_KEY,
  publishListTabSyncEvent,
  subscribeToListTabSyncEvents,
  type ListTabSyncEvent,
} from "./ListTabSyncService";

describe("ListTabSyncService", () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
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
