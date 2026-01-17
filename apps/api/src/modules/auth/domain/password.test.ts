import { PASSWORD_RULES, isPasswordValid } from "./password.js";

describe("password policy", () => {
  it("accepts a password that satisfies all rules", () => {
    const password = "Password12!A";

    expect(isPasswordValid(password)).toBe(true);
  });

  it("rejects passwords shorter than the minimum length", () => {
    const password = "Aa1!" + "a".repeat(PASSWORD_RULES.min - 5);

    expect(isPasswordValid(password)).toBe(false);
  });

  it("rejects passwords longer than the maximum length", () => {
    const password = "Aa1!" + "a".repeat(PASSWORD_RULES.max - 3);

    expect(isPasswordValid(password)).toBe(false);
  });

  it("requires at least one lowercase letter", () => {
    const password = "PASSWORD12!A";

    expect(isPasswordValid(password)).toBe(false);
  });

  it("requires at least one uppercase letter", () => {
    const password = "password12!a";

    expect(isPasswordValid(password)).toBe(false);
  });

  it("requires at least one number", () => {
    const password = "Password!!Aa";

    expect(isPasswordValid(password)).toBe(false);
  });

  it("requires at least one special character", () => {
    const password = "Password12Aa";

    expect(isPasswordValid(password)).toBe(false);
  });
});
