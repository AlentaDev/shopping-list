import { USERS_MESSAGES } from "../../shared/constants/usersMessages";
import { postalCodeSchema } from "./postalCode";

describe("postal code value object", () => {
  it("accepts valid postal codes", () => {
    const result = postalCodeSchema.safeParse("28001");

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe("28001");
    }
  });

  it("accepts empty postal codes", () => {
    const result = postalCodeSchema.safeParse("");

    expect(result.success).toBe(true);
  });

  it("returns the shared message when invalid", () => {
    const result = postalCodeSchema.safeParse("12");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        USERS_MESSAGES.postalCodeInvalid
      );
    }
  });
});
