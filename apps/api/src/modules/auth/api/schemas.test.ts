import {
  emailSchema,
  nameSchema,
  postalCodeSchema,
} from "../../../core/value-objects";
import { AUTH_MESSAGES } from "../../../shared/constants/authMessages";
import { USERS_MESSAGES } from "../../../shared/constants/usersMessages";
import { loginSchema, signupSchema } from "./schemas";

const validSignup = {
  name: "Test User",
  email: "test@example.com",
  password: "Password12!A",
  postalCode: "12345",
};

describe("auth schemas", () => {
  it("accepts a valid signup payload", () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it("accepts a signup payload without postal code", () => {
    const result = signupSchema.safeParse({
      name: "Test User",
      email: "test@example.com",
      password: "Password12!A",
    });

    expect(result.success).toBe(true);
  });

  it("rejects signup passwords that do not meet the policy", () => {
    const result = signupSchema.safeParse({
      ...validSignup,
      password: "password",
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password12!A",
    });

    expect(result.success).toBe(true);
  });

  it("returns the expected email validation message", () => {
    const result = emailSchema.safeParse("not-an-email");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(USERS_MESSAGES.emailInvalid);
    }
  });

  it("returns the expected password validation message", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message);
      expect(messages).toContain(AUTH_MESSAGES.passwordLength);
    }
  });

  it("returns the expected name validation message", () => {
    const result = nameSchema.safeParse("");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(USERS_MESSAGES.nameRequired);
    }
  });

  it("returns the expected postal code validation message", () => {
    const result = postalCodeSchema.safeParse("12");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        USERS_MESSAGES.postalCodeInvalid
      );
    }
  });
});
