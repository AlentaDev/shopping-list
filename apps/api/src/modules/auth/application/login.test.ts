import { describe, expect, it } from "vitest";
import { InMemoryUserRepository } from "../infrastructure/InMemoryUserRepository";
import { InMemoryRefreshTokenRepository } from "../infrastructure/InMemoryRefreshTokenRepository";
import { LoginUser } from "./login";
import { InvalidCredentialsError } from "./errors";
import { PasswordHasher, TokenGenerator } from "./ports";
import { InMemorySessionStore } from "../infrastructure/InMemorySessionStore";

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

describe("LoginUser", () => {
  it("returns tokens and session id for valid credentials", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const sessionStore = new InMemorySessionStore();
    const passwordHasher = new FakePasswordHasher();
    const tokenGenerator = new FakeTokenGenerator([
      "access-token",
      "refresh-token",
    ]);
    const loginUser = new LoginUser(
      userRepository,
      passwordHasher,
      sessionStore,
      refreshTokenRepository,
      tokenGenerator
    );

    await userRepository.save({
      id: "user-1",
      name: "Alice",
      email: "alice@example.com",
      passwordHash: await passwordHasher.hash("secret"),
      postalCode: "12345",
    });

    const result = await loginUser.execute({
      email: "alice@example.com",
      password: "secret",
    });

    expect(result.user.id).toBe("user-1");
    expect(result.sessionId).toEqual(expect.any(String));
    expect(result.accessToken).toBe("access-token");
    expect(result.refreshToken).toBe("refresh-token");

    const storedUserId = await refreshTokenRepository.findUserIdByToken(
      "refresh-token"
    );
    expect(storedUserId).toBe("user-1");
  });

  it("rejects invalid credentials", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const sessionStore = new InMemorySessionStore();
    const passwordHasher = new FakePasswordHasher();
    const tokenGenerator = new FakeTokenGenerator(["access", "refresh"]);
    const loginUser = new LoginUser(
      userRepository,
      passwordHasher,
      sessionStore,
      refreshTokenRepository,
      tokenGenerator
    );

    await expect(
      loginUser.execute({
        email: "missing@example.com",
        password: "secret",
      })
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
