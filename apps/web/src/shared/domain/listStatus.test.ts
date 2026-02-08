import { describe, it, expect } from "vitest";
import { LIST_STATUS } from "./listStatus";

describe("listStatus", () => {
  it("expone los estados esperados", () => {
    expect(LIST_STATUS).toEqual({
      LOCAL_DRAFT: "LOCAL_DRAFT",
      DRAFT: "DRAFT",
      ACTIVE: "ACTIVE",
      COMPLETED: "COMPLETED",
    });
  });
});
