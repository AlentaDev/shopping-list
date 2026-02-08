import { describe, expect, it } from "vitest";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import {
  canActivateList,
  canCompleteList,
  canDuplicateList,
  canEditList,
  canDeleteList,
} from "./listStatus";

describe("listStatus", () => {
  it("permite activar listas en estado LOCAL_DRAFT y DRAFT", () => {
    expect(canActivateList(LIST_STATUS.LOCAL_DRAFT)).toBe(true);
    expect(canActivateList(LIST_STATUS.DRAFT)).toBe(true);
    expect(canActivateList(LIST_STATUS.ACTIVE)).toBe(false);
    expect(canActivateList(LIST_STATUS.COMPLETED)).toBe(false);
  });

  it("permite completar solo listas ACTIVE", () => {
    expect(canCompleteList(LIST_STATUS.ACTIVE)).toBe(true);
    expect(canCompleteList(LIST_STATUS.DRAFT)).toBe(false);
    expect(canCompleteList(LIST_STATUS.COMPLETED)).toBe(false);
    expect(canCompleteList(LIST_STATUS.LOCAL_DRAFT)).toBe(false);
  });

  it("permite editar listas no completadas", () => {
    expect(canEditList(LIST_STATUS.LOCAL_DRAFT)).toBe(true);
    expect(canEditList(LIST_STATUS.DRAFT)).toBe(true);
    expect(canEditList(LIST_STATUS.ACTIVE)).toBe(true);
    expect(canEditList(LIST_STATUS.COMPLETED)).toBe(false);
  });

  it("permite duplicar solo listas COMPLETED", () => {
    expect(canDuplicateList(LIST_STATUS.COMPLETED)).toBe(true);
    expect(canDuplicateList(LIST_STATUS.DRAFT)).toBe(false);
    expect(canDuplicateList(LIST_STATUS.ACTIVE)).toBe(false);
    expect(canDuplicateList(LIST_STATUS.LOCAL_DRAFT)).toBe(false);
  });

  it("permite borrar listas en cualquier estado", () => {
    expect(canDeleteList(LIST_STATUS.LOCAL_DRAFT)).toBe(true);
    expect(canDeleteList(LIST_STATUS.DRAFT)).toBe(true);
    expect(canDeleteList(LIST_STATUS.ACTIVE)).toBe(true);
    expect(canDeleteList(LIST_STATUS.COMPLETED)).toBe(true);
  });
});
