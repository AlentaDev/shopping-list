import { describe, expect, it } from "vitest";
import { Password } from "../src/modules/auth/domain/password";

describe("Password value object", () => {
  it("creates a password when it meets all rules", () => {
    const password = Password.create("ValidPassword1!");

    expect(password.value).toBe("ValidPassword1!");
  });

  it.each([
    ["too short", "Short1!"],
    ["too long", "ThisPasswordIsWayTooLong1!"],
    ["missing lowercase", "PASSWORD123!"],
    ["missing uppercase", "password123!"],
    ["missing number", "Password!!!!"],
    ["missing special", "Password1234"],
  ])("rejects password that is %s", (_label, value) => {
    expect(() => Password.create(value)).toThrow();
  });
});
