import { describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../infrastructure/InMemoryUserRepository";
import { InMemoryRefreshTokenRepository } from "../infrastructure/InMemoryRefreshTokenRepository";
import { RegisterUser } from "./register";
import { DuplicateEmailError, InvalidPasswordError } from "./errors";
import { PasswordHasher, TokenGenerator } from "./ports";

class FakePasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return `hashed:${value}`;
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return hashedValue === `hashed:${value}`;
  }
}

class FakeTokenGenerator implements TokenGenerator {
  private index = 0;

  constructor(private readonly tokens: string[]) {}

  generate(): string {
    const token = this.tokens[this.index];
    if (!token) {
      throw new Error("No more tokens");
    }
    this.index += 1;
    return token;
  }
}

describe("RegisterUser", () => {
  it("creates a user and returns access/refresh tokens", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenGenerator = new FakeTokenGenerator([
      "access-token",
      "refresh-token",
    ]);
    const registerUser = new RegisterUser(
      userRepository,
      passwordHasher,
      refreshTokenRepository,
      tokenGenerator
    );

    const result = await registerUser.execute({
      name: "Alice",
      email: "alice@example.com",
      password: "secret",
      postalCode: "12345",
    });

    expect(result.user).toMatchObject({
      name: "Alice",
      email: "alice@example.com",
      postalCode: "12345",
    });
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");

    const storedUser = await userRepository.findByEmail("alice@example.com");
    expect(storedUser).not.toBeNull();
    const storedUserId = await refreshTokenRepository.findUserIdByToken(
      "refresh-token"
    );
    expect(storedUserId).toBe(storedUser?.id);
  });

  it("rejects duplicate emails", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenGenerator = new FakeTokenGenerator(["access", "refresh"]);
    const registerUser = new RegisterUser(
      userRepository,
      passwordHasher,
      refreshTokenRepository,
      tokenGenerator
    );

    await registerUser.execute({
      name: "Alice",
      email: "alice@example.com",
      password: "secret",
      postalCode: "12345",
    });

    await expect(
      registerUser.execute({
        name: "Alice",
        email: "alice@example.com",
        password: "secret",
        postalCode: "12345",
      })
    ).rejects.toBeInstanceOf(DuplicateEmailError);
  });

  it("rejects empty passwords", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const passwordHasher = new FakePasswordHasher();
    const tokenGenerator = new FakeTokenGenerator(["access", "refresh"]);
    const registerUser = new RegisterUser(
      userRepository,
      passwordHasher,
      refreshTokenRepository,
      tokenGenerator
    );

    await expect(
      registerUser.execute({
        name: "Alice",
        email: "alice@example.com",
        password: "",
        postalCode: "12345",
      })
    ).rejects.toBeInstanceOf(InvalidPasswordError);
  });
});
