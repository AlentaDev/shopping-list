import { describe, expect, it } from "vitest";
import {
  Email,
  Name,
  Password,
  PostalCode,
} from "./index";
import { UI_TEXT } from "../../../../shared/constants/ui";

describe("Auth value objects", () => {
  it("creates a normalized email", () => {
    const result = Email.create(" Ada+test@Example.com ");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.value).toBe("ada+test@example.com");
    }
  });

  it("fails when email is invalid", () => {
    const result = Email.create("invalid-email");

    expect(result).toEqual({
      ok: false,
      error: UI_TEXT.AUTH.VALIDATION.EMAIL_INVALID,
    });
  });

  it("validates password length and complexity", () => {
    const tooShort = Password.create("Short1!");
    const missingComplexity = Password.create("longpasswordhere");

    expect(tooShort).toEqual({
      ok: false,
      error: UI_TEXT.AUTH.VALIDATION.PASSWORD_LENGTH,
    });
    expect(missingComplexity).toEqual({
      ok: false,
      error: UI_TEXT.AUTH.VALIDATION.PASSWORD_COMPLEXITY,
    });
  });

  it("trims and validates name length", () => {
    const valid = Name.create("  Ada  ");
    const invalid = Name.create(" ");

    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.value.value).toBe("Ada");
    }
    expect(invalid).toEqual({
      ok: false,
      error: UI_TEXT.AUTH.VALIDATION.NAME_REQUIRED,
    });
  });

  it("validates postal code format", () => {
    const valid = PostalCode.create("28001");
    const invalid = PostalCode.create("1234a");
    const empty = PostalCode.create("");

    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.value.value).toBe("28001");
    }
    expect(invalid).toEqual({
      ok: false,
      error: UI_TEXT.AUTH.VALIDATION.POSTAL_CODE_INVALID,
    });
    expect(empty.ok).toBe(true);
    if (empty.ok) {
      expect(empty.value.value).toBe("");
    }
  });
});
