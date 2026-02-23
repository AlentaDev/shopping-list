import { describe, expect, it } from "vitest";
import {
  ListEditingStateInvariantError,
  normalizeEditingState,
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
