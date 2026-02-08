import { describe, expect, it } from "vitest";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import { canActivateList } from "./listStatus";

describe("listStatus", () => {
  it("permite activar listas en estado LOCAL_DRAFT y DRAFT", () => {
    expect(canActivateList(LIST_STATUS.LOCAL_DRAFT)).toBe(true);
    expect(canActivateList(LIST_STATUS.DRAFT)).toBe(true);
    expect(canActivateList(LIST_STATUS.ACTIVE)).toBe(false);
    expect(canActivateList(LIST_STATUS.COMPLETED)).toBe(false);
  });
});
