import { RegisterWithTokens } from "./registerWithTokens";
import { InMemoryUserRepository } from "../../users/public";
import { InMemoryRefreshTokenStore } from "../infrastructure/InMemoryRefreshTokenStore";
import type {
  AccessTokenService,
  Clock,
  PasswordHasher,
} from "./ports";
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from "./tokenPolicy";

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

describe("RegisterWithTokens", () => {
  it("creates a user and returns access/refresh tokens", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    const register = new RegisterWithTokens(
      userRepository,
      passwordHasher,
      accessTokenService,
      refreshTokenStore,
      clock
    );

    const result = await register.execute({
      name: "Alice",
      email: "alice@example.com",
      password: "Password12!A",
      postalCode: "12345",
    });

    const storedUser = await userRepository.findByEmail("alice@example.com");

    expect(storedUser).toEqual({
      id: result.user.id,
      name: "Alice",
      email: "alice@example.com",
      passwordHash: "hashed:Password12!A",
      postalCode: "12345",
    });
    expect(result.tokens.accessToken).toContain(result.user.id);
    expect(result.tokens.accessTokenExpiresAt).toEqual(
      new Date(fixedNow.getTime() + ACCESS_TOKEN_TTL_MS)
    );
    expect(result.tokens.refreshTokenExpiresAt).toEqual(
      new Date(fixedNow.getTime() + REFRESH_TOKEN_TTL_MS)
    );

    const refreshRecord = await refreshTokenStore.find(
      result.tokens.refreshToken
    );
    expect(refreshRecord).toMatchObject({
      userId: result.user.id,
      expiresAt: new Date(fixedNow.getTime() + REFRESH_TOKEN_TTL_MS),
    });
  });

  it("rejects duplicate email registrations", async () => {
    const userRepository = new InMemoryUserRepository();
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    const register = new RegisterWithTokens(
      userRepository,
      passwordHasher,
      accessTokenService,
      refreshTokenStore,
      clock
    );

    await register.execute({
      name: "Alice",
      email: "alice@example.com",
      password: "Password12!A",
      postalCode: "12345",
    });

    await expect(
      register.execute({
        name: "Alice",
        email: "alice@example.com",
        password: "Password12!A",
        postalCode: "12345",
      })
    ).rejects.toMatchObject({ code: "duplicate_email" });
  });
});
