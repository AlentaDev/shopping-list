import { EMAIL_MESSAGES, emailSchema } from "./email";

describe("email value object", () => {
  it("normalizes and accepts valid emails", () => {
    const result = emailSchema.safeParse("  TEST@Example.com ");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("test@example.com");
    }
  });

  it("returns the shared validation message when email is missing", () => {
    const result = emailSchema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(EMAIL_MESSAGES.required);
    }
  });

  it("returns the shared validation message when email is invalid", () => {
    const result = emailSchema.safeParse("not-an-email");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(EMAIL_MESSAGES.invalid);
    }
  });
});
