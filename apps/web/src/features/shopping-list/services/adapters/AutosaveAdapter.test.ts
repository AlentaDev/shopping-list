import { describe, expect, it } from "vitest";

import { adaptAutosaveSummaryResponse } from "./AutosaveAdapter";

describe("AutosaveAdapter", () => {
  it("devuelve un resumen vacío cuando el payload es null", () => {
    expect(adaptAutosaveSummaryResponse(null)).toEqual({
      id: "",
      title: "",
      updatedAt: "",
    });
  });
});
