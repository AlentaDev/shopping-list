// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAutosaveTabSyncService,
  DRAFT_STORAGE_KEY,
  DRAFT_SYNC_STORAGE_KEY,
} from "./AutosaveTabSyncService";

describe("AutosaveTabSyncService", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("notifica cambios del borrador cuando cambia lists.localDraft", () => {
    const onDraftChanged = vi.fn();
    const service = createAutosaveTabSyncService({ tabId: "tab-a" });

    service.onDraftChanged(onDraftChanged);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: DRAFT_STORAGE_KEY,
        newValue: JSON.stringify({
          title: "Lista nueva",
          items: [],
          updatedAt: "2024-01-01T00:00:00.000Z",
        }),
      }),
    );

    expect(onDraftChanged).toHaveBeenCalledOnce();

    service.dispose();
  });

  it("ignora keys distintas", () => {
    const onDraftChanged = vi.fn();
    const onBaseUpdatedAtChanged = vi.fn();
    const service = createAutosaveTabSyncService({ tabId: "tab-a" });

    service.onDraftChanged(onDraftChanged);
    service.onBaseUpdatedAtChanged(onBaseUpdatedAtChanged);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "another.key",
        newValue: JSON.stringify({ value: "x" }),
      }),
    );

    expect(onDraftChanged).not.toHaveBeenCalled();
    expect(onBaseUpdatedAtChanged).not.toHaveBeenCalled();

    service.dispose();
  });

  it("notifica cambios de baseUpdatedAt para lists.localDraftSync", () => {
    const onBaseUpdatedAtChanged = vi.fn();
    const service = createAutosaveTabSyncService({ tabId: "tab-a" });

    service.onBaseUpdatedAtChanged(onBaseUpdatedAtChanged);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: DRAFT_SYNC_STORAGE_KEY,
        newValue: JSON.stringify({
          baseUpdatedAt: "2024-01-01T00:00:00.000Z",
          sourceTabId: "tab-b",
        }),
      }),
    );

    expect(onBaseUpdatedAtChanged).toHaveBeenCalledWith(
      "2024-01-01T00:00:00.000Z",
    );

    service.dispose();
  });

  it("ignora eventos de sync originados por la misma pestaña", () => {
    const onBaseUpdatedAtChanged = vi.fn();
    const service = createAutosaveTabSyncService({ tabId: "tab-a" });

    service.onBaseUpdatedAtChanged(onBaseUpdatedAtChanged);

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: DRAFT_SYNC_STORAGE_KEY,
        newValue: JSON.stringify({
          baseUpdatedAt: "2024-01-01T00:00:00.000Z",
          sourceTabId: "tab-a",
        }),
      }),
    );

    expect(onBaseUpdatedAtChanged).not.toHaveBeenCalled();

    service.dispose();
  });
});
