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
      password: "anything",
    });

    expect(result.success).toBe(true);
  });
});
