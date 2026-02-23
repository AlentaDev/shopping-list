import { describe, expect, it } from "vitest";

import { adaptAutosaveResponse, adaptAutosaveSummaryResponse } from "./AutosaveAdapter";

describe("AutosaveAdapter", () => {
  it("normaliza sourceProductId prefijado con id técnico", () => {
    expect(
      adaptAutosaveResponse({
        id: "autosave-1",
        title: "Lista",
        updatedAt: "2024-01-01T00:00:00.000Z",
        items: [
          {
            id: "active-1:4706",
            kind: "catalog",
            name: "Leche",
            qty: 1,
            sourceProductId: "active-1:4706:4706",
          },
        ],
      })?.items[0]?.sourceProductId,
    ).toBe("4706");
  });

  it("devuelve un resumen vacío cuando el payload es null", () => {
    expect(adaptAutosaveSummaryResponse(null)).toEqual({
      id: "",
      title: "",
      updatedAt: "",
    });
  });
});
