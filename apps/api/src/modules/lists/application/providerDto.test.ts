import { describe, expect, it } from "vitest";
import { toListProviderDto } from "./providerDto.js";

describe("providerDto", () => {
  it("returns a friendly Bonpreu display name", () => {
    expect(toListProviderDto("provider-bonpreuesclat")).toEqual({
      slug: "bonpreuesclat",
      displayName: "Bonpreu Esclat",
    });
  });
});
