import { describe, it, expect } from "vitest";
import { toAuthSession } from "./AuthAdapter";

describe("AuthAdapter", () => {
  it("maps auth response to session", () => {
    const session = toAuthSession({
      token: "token-123",
      user: {
        id: "user-1",
        name: "Ana",
        email: "ana@example.com",
      },
    });

    expect(session).toEqual({
      token: "token-123",
      userId: "user-1",
      userName: "Ana",
      email: "ana@example.com",
    });
  });
});
