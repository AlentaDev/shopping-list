import { describe, expect, it } from "vitest";
import { adaptListStatusResponse } from "./ListStatusAdapter";
import { LIST_STATUS } from "../listStatus";

describe("ListStatusAdapter", () => {
  it("normaliza la respuesta del status de lista", () => {
    const payload = {
      id: "list-1",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-01T10:00:00.000Z",
    };

    expect(adaptListStatusResponse(payload)).toEqual({
      id: "list-1",
      status: LIST_STATUS.ACTIVE,
      updatedAt: "2024-02-01T10:00:00.000Z",
    });
  });

  it("usa valores por defecto cuando faltan campos", () => {
    expect(adaptListStatusResponse({})).toEqual({
      id: "",
      status: LIST_STATUS.DRAFT,
      updatedAt: "",
    });
  });
});
