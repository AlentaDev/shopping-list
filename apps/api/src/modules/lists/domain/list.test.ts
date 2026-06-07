import { describe, expect, it } from "vitest";
import {
  ensureProviderCanChange,
  ListProviderInvariantError,
  ListEditingStateInvariantError,
  normalizeEditingState,
  resolveListProviderId,
  resolveListProviderSlug,
} from "./list.js";

describe("normalizeEditingState", () => {
  it("allows draft without editing target when isEditing=false", () => {
    expect(
      normalizeEditingState({
        status: "DRAFT",
        isEditing: false,
        editingTargetListId: null,
      }),
    ).toEqual({
      isEditing: false,
      editingTargetListId: null,
    });
  });

  it("allows draft with editing target when isEditing=true", () => {
    expect(
      normalizeEditingState({
        status: "DRAFT",
        isEditing: true,
        editingTargetListId: "active-list-1",
      }),
    ).toEqual({
      isEditing: true,
      editingTargetListId: "active-list-1",
    });
  });

  it("allows active list without editing target", () => {
    expect(
      normalizeEditingState({
        status: "ACTIVE",
        isEditing: true,
        editingTargetListId: null,
      }),
    ).toEqual({
      isEditing: true,
      editingTargetListId: null,
    });
  });

  it("allows completed list only when not editing and without target", () => {
    expect(
      normalizeEditingState({
        status: "COMPLETED",
        isEditing: false,
        editingTargetListId: null,
      }),
    ).toEqual({
      isEditing: false,
      editingTargetListId: null,
    });
  });

  it("rejects draft editing without target list", () => {
    expect(() =>
      normalizeEditingState({
        status: "DRAFT",
        isEditing: true,
        editingTargetListId: null,
      }),
    ).toThrow(ListEditingStateInvariantError);
  });

  it("rejects draft with target list when isEditing=false", () => {
    expect(() =>
      normalizeEditingState({
        status: "DRAFT",
        isEditing: false,
        editingTargetListId: "active-list-1",
      }),
    ).toThrow(ListEditingStateInvariantError);
  });

  it("rejects non-draft list with editing target", () => {
    expect(() =>
      normalizeEditingState({
        status: "ACTIVE",
        isEditing: true,
        editingTargetListId: "active-list-1",
      }),
    ).toThrow(ListEditingStateInvariantError);
  });

  it("rejects completed list when isEditing=true", () => {
    expect(() =>
      normalizeEditingState({
        status: "COMPLETED",
        isEditing: true,
        editingTargetListId: null,
      }),
    ).toThrow(ListEditingStateInvariantError);
  });
});

describe("ensureProviderCanChange", () => {
  it("treats FK id and legacy mercadona slug as the same provider", () => {
    expect(() =>
      ensureProviderCanChange({
        status: "ACTIVE",
        itemCount: 1,
        currentProviderId: "provider-mercadona",
        nextProviderId: "mercadona",
      }),
    ).not.toThrow();
  });

  it("allows provider change for empty draft", () => {
    expect(() =>
      ensureProviderCanChange({
        status: "DRAFT",
        itemCount: 0,
        currentProviderId: "mercadona",
        nextProviderId: "carrefour",
      }),
    ).not.toThrow();
  });

  it("rejects provider change for non-empty draft", () => {
    expect(() =>
      ensureProviderCanChange({
        status: "DRAFT",
        itemCount: 1,
        currentProviderId: "mercadona",
        nextProviderId: "carrefour",
      }),
    ).toThrow(ListProviderInvariantError);
  });

  it.each(["ACTIVE", "COMPLETED"] as const)(
    "rejects provider change for %s lists",
    (status) => {
      expect(() =>
        ensureProviderCanChange({
          status,
          itemCount: 0,
          currentProviderId: "mercadona",
          nextProviderId: "carrefour",
        }),
      ).toThrow(ListProviderInvariantError);
    },
  );
});

describe("provider reference resolution", () => {
  it("normalizes legacy mercadona slug to provider FK id", () => {
    expect(resolveListProviderId("mercadona")).toBe("provider-mercadona");
  });

  it("normalizes bonpreu slug to provider FK id", () => {
    expect(resolveListProviderId("bonpreuesclat")).toBe(
      "provider-bonpreuesclat",
    );
  });

  it("resolves mercadona slug from FK id", () => {
    expect(resolveListProviderSlug("provider-mercadona")).toBe("mercadona");
  });

  it("resolves bonpreu slug from FK id", () => {
    expect(resolveListProviderSlug("provider-bonpreuesclat")).toBe(
      "bonpreuesclat",
    );
  });
});
