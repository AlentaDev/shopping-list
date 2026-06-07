// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { ListProvider } from "./ListContext";
import { useList } from "./useList";
import { useDraftProviderConflict } from "./useDraftProviderConflict";
import type { ListItem } from "./ListContextValue";

const ITEM_FIXTURE: ListItem = {
  id: "item-1",
  name: "Manzanas",
  category: "Frutas",
  thumbnail: null,
  price: 1.2,
  quantity: 1,
};

const renderConflictHook = (
  initialDraftProviderId: string,
  initialItems: ListItem[] = [],
) =>
  renderHook(
    () => ({
      conflict: useDraftProviderConflict(),
      list: useList(),
    }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <ListProvider
          initialDraftProviderId={initialDraftProviderId}
          initialItems={initialItems}
        >
          {children}
        </ListProvider>
      ),
    },
  );

describe("useDraftProviderConflict", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("returns shouldSilentSwitch=true when draft has no items", () => {
    const { result } = renderConflictHook("mercadona", []);

    expect(result.current.conflict.shouldSilentSwitch).toBe(true);
  });

  it("returns shouldSilentSwitch=false when draft has items", () => {
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);

    expect(result.current.conflict.shouldSilentSwitch).toBe(false);
  });

  it("skips confirm when requested provider matches the current draft provider", async () => {
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);
    const confirmSpy = vi.spyOn(window, "confirm");

    let proceed = false;
    await act(async () => {
      proceed = await result.current.conflict.confirmAndReset({
        requestedProviderId: "mercadona",
      });
    });

    expect(proceed).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(result.current.list.items).toHaveLength(1);
    expect(result.current.list.draftProviderId).toBe("mercadona");
  });

  it("silently switches provider when the draft is empty", async () => {
    const { result } = renderConflictHook("mercadona", []);
    const confirmSpy = vi.spyOn(window, "confirm");

    let proceed = false;
    await act(async () => {
      proceed = await result.current.conflict.confirmAndReset({
        requestedProviderId: "bonpreuesclat",
      });
    });

    expect(proceed).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(result.current.list.draftProviderId).toBe("bonpreuesclat");
    expect(result.current.list.items).toHaveLength(0);
  });

  it("shows confirm with explicit provider labels on cross-provider mutation with items", async () => {
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    let proceed = false;
    await act(async () => {
      proceed = await result.current.conflict.confirmAndReset({
        requestedProviderId: "bonpreuesclat",
      });
    });

    expect(proceed).toBe(true);
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringContaining("Mercadona"));
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("Bonpreu Esclat"),
    );
    expect(result.current.list.draftProviderId).toBe("bonpreuesclat");
    expect(result.current.list.items).toHaveLength(0);
  });

  it("keeps draft intact and returns false when confirm is cancelled", async () => {
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);

    let proceed = true;
    await act(async () => {
      proceed = await result.current.conflict.confirmAndReset({
        requestedProviderId: "bonpreuesclat",
      });
    });

    expect(proceed).toBe(false);
    expect(confirmSpy).toHaveBeenCalled();
    expect(result.current.list.draftProviderId).toBe("mercadona");
    expect(result.current.list.items).toHaveLength(1);
  });

  it("uses requestedProviderName override in the confirm message when provided", async () => {
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    await act(async () => {
      await result.current.conflict.confirmAndReset({
        requestedProviderId: "unknown-slug",
        requestedProviderName: "Custom Provider",
      });
    });

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining("Custom Provider"),
    );
  });

  it("delegates to onActiveEditConflict and skips confirm when an edit session exists", async () => {
    localStorage.setItem(
      "lists.editSession",
      JSON.stringify({ listId: "active-list-1", isEditing: true }),
    );
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);
    const onActiveEditConflict = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm");

    let proceed = true;
    await act(async () => {
      proceed = await result.current.conflict.confirmAndReset({
        requestedProviderId: "bonpreuesclat",
        onActiveEditConflict,
      });
    });

    expect(proceed).toBe(false);
    expect(onActiveEditConflict).toHaveBeenCalledWith({
      currentProviderId: "mercadona",
      requestedProviderId: "bonpreuesclat",
    });
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(result.current.list.draftProviderId).toBe("mercadona");
    expect(result.current.list.items).toHaveLength(1);
  });

  it("falls back to confirm when no edit session exists, even if onActiveEditConflict is set", async () => {
    const { result } = renderConflictHook("mercadona", [ITEM_FIXTURE]);
    const onActiveEditConflict = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);

    let proceed = false;
    await act(async () => {
      proceed = await result.current.conflict.confirmAndReset({
        requestedProviderId: "bonpreuesclat",
        onActiveEditConflict,
      });
    });

    expect(proceed).toBe(true);
    expect(onActiveEditConflict).not.toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalled();
    expect(result.current.list.draftProviderId).toBe("bonpreuesclat");
  });
});
