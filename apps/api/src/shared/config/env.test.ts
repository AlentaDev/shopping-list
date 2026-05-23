import { describe, expect, it } from "vitest";
import { resolveAccessTokenSecret, resolvePort } from "./env.js";

describe("api config", () => {
  it("fails fast when ACCESS_TOKEN_SECRET is missing", () => {
    expect(() => resolveAccessTokenSecret({})).toThrow(
      "ACCESS_TOKEN_SECRET must be configured.",
    );
  });

  it.each(["", "abc", "0", "-1", "3000.5", "65536"])(
    "fails fast when PORT is invalid: %s",
    (port) => {
      expect(() => resolvePort({ PORT: port })).toThrow(
        "PORT must be a valid port number.",
      );
    },
  );

  it("uses port 3000 when PORT is missing", () => {
    expect(resolvePort({})).toBe(3000);
  });
});
