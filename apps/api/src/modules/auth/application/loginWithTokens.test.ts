import { LoginWithTokens } from "./loginWithTokens.js";
import { InMemoryUserRepository } from "@src/modules/users/public.js";
import { InMemoryRefreshTokenStore } from "../infrastructure/InMemoryRefreshTokenStore.js";
import type { AccessTokenService, Clock, PasswordHasher } from "./ports.js";
import { ACCESS_TOKEN_TTL_MS, REFRESH_TOKEN_TTL_MS } from "./tokenPolicy.js";
import {
  toEmail,
  toName,
  toPostalCode,
} from "@src/core/value-objects/index.js";

const fixedNow = new Date("2024-01-01T00:00:00.000Z");

const clock: Clock = {
  now: () => fixedNow,
};

const passwordHasher: PasswordHasher = {
  hash: async (value) => `hashed:${value}`,
  compare: async (value, hashed) => hashed === `hashed:${value}`,
};

class FakeAccessTokenService implements AccessTokenService {
  private counter = 0;

  async create(userId: string, expiresAt: Date): Promise<string> {
    return `access-${userId}-${expiresAt.getTime()}-${this.counter++}`;
  }
}

describe("LoginWithTokens", () => {
  it("returns tokens for valid credentials", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    await userRepository.save({
      id: "user-1",
      name: toName("Alice"),
      email: toEmail("alice@example.com"),
      passwordHash: "hashed:Password12!A",
      postalCode: toPostalCode("12345"),
    });

    const login = new LoginWithTokens(
      userRepository,
      passwordHasher,
      accessTokenService,
      refreshTokenStore,
      clock,
    );

    const result = await login.execute({
      email: "alice@example.com",
      password: "Password12!A",
    });

    expect(result.user.id).toBe("user-1");
    expect(result.tokens.accessToken).toContain("user-1");
    expect(result.tokens.accessTokenExpiresAt).toEqual(
      new Date(fixedNow.getTime() + ACCESS_TOKEN_TTL_MS),
    );
    expect(result.tokens.refreshTokenExpiresAt).toEqual(
      new Date(fixedNow.getTime() + REFRESH_TOKEN_TTL_MS),
    );

    const refreshRecord = await refreshTokenStore.find(
      result.tokens.refreshToken,
    );
    expect(refreshRecord).toMatchObject({
      userId: "user-1",
      expiresAt: new Date(fixedNow.getTime() + REFRESH_TOKEN_TTL_MS),
    });
  });

  it("rejects invalid credentials", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    await userRepository.save({
      id: "user-1",
      name: toName("Alice"),
      email: toEmail("alice@example.com"),
      passwordHash: "hashed:Password12!A",
      postalCode: toPostalCode("12345"),
    });

    const login = new LoginWithTokens(
      userRepository,
      passwordHasher,
      accessTokenService,
      refreshTokenStore,
      clock,
    );

    await expect(
      login.execute({ email: "alice@example.com", password: "wrong" }),
    ).rejects.toMatchObject({ code: "invalid_credentials" });
  });
});
