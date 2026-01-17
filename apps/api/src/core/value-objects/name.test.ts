import { USERS_MESSAGES } from "@src/shared/constants/usersMessages.js";
import { nameSchema } from "./name.js";

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
      expect(result.error.issues[0]?.message).toBe(USERS_MESSAGES.nameRequired);
    }
  });

  it("returns the length message when too short", () => {
    const result = nameSchema.safeParse("A");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(USERS_MESSAGES.nameLength);
    }
  });
});
