import { describe, expect, it } from "vitest";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import { getListActions } from "./listActions";

describe("listActions", () => {
  it("define las acciones para borradores", () => {
    expect(getListActions(LIST_STATUS.DRAFT)).toEqual([
      "edit",
      "activate",
      "delete",
    ]);
  });

  it("define las acciones para activas", () => {
    expect(getListActions(LIST_STATUS.ACTIVE)).toEqual([
      "edit",
      "complete",
      "delete",
    ]);
  });

  it("define las acciones para completadas", () => {
    expect(getListActions(LIST_STATUS.COMPLETED)).toEqual([
      "view",
      "reuse",
      "delete",
    ]);
  });
});
