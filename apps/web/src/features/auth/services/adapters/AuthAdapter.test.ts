import { describe, expect, it } from "vitest";
import { adaptAuthUserResponse, adaptOkResponse } from "./AuthAdapter";

describe("AuthAdapter", () => {
  it("adapta usuario auth con defaults", () => {
    expect(adaptAuthUserResponse({ id: "u1", email: "mail@test.com" })).toEqual({
      id: "u1",
      name: "",
      email: "mail@test.com",
      postalCode: "",
    });
  });

  it("adapta respuesta ok con fallback", () => {
    expect(adaptOkResponse({ ok: true })).toEqual({ ok: true });
    expect(adaptOkResponse({})).toEqual({ ok: false });
  });
});
