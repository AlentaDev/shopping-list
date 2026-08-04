import { describe, expect, it } from "vitest";
import { createCatalogModule } from "./catalogModule.js";

describe("catalog module", () => {
  it("wires Mercadona as its only available catalogue provider", () => {
    const module = createCatalogModule();

    expect(module.providers).toHaveLength(1);
    expect(module.providers[0].metadata?.slug).toBe("mercadona");
    expect(() => module.providerResolver.resolve("bonpreuesclat")).toThrow();
  });
});
