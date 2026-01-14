import { NAME_MESSAGES, nameSchema } from "./name";

describe("name value object", () => {
  it("accepts a valid name", () => {
    const result = nameSchema.safeParse("  Ana María  ");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("Ana María");
    }
  });

  it("returns the required message when missing", () => {
    const result = nameSchema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(NAME_MESSAGES.required);
    }
  });

  it("returns the length message when too short", () => {
    const result = nameSchema.safeParse("A");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(NAME_MESSAGES.length);
    }
  });
});
