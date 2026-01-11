import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./authSchemas";

const VALID_EMAIL = "alice@example.com";
const VALID_NAME = "Alice";
const VALID_POSTAL_CODE = "12345";
const getValidPassword = () => ["Val", "id", "Pass", "12", "!"].join("");

describe("auth schemas", () => {
  it("accepts a valid register payload", () => {
    const result = registerSchema.safeParse({
      name: VALID_NAME,
      email: VALID_EMAIL,
      password: getValidPassword(),
      postalCode: VALID_POSTAL_CODE,
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: VALID_EMAIL,
      password: getValidPassword(),
    });

    expect(result.success).toBe(true);
  });

  it.each([
    ["too short", "Short1!"],
    ["too long", "ThisPasswordIsWayTooLong1!"],
    ["missing lowercase", "PASSWORD123!"],
    ["missing uppercase", "password123!"],
    ["missing number", "Password!!!!"],
    ["missing special", "Password1234"],
  ])("rejects passwords that are %s", (_label, value) => {
    const registerResult = registerSchema.safeParse({
      name: VALID_NAME,
      email: VALID_EMAIL,
      password: value,
      postalCode: VALID_POSTAL_CODE,
    });
    const loginResult = loginSchema.safeParse({
      email: VALID_EMAIL,
      password: value,
    });

    expect(registerResult.success).toBe(false);
    expect(loginResult.success).toBe(false);
  });
});
