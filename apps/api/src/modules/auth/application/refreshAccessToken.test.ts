import { RefreshAccessToken } from "./refreshAccessToken.js";
import { InMemoryRefreshTokenStore } from "../infrastructure/InMemoryRefreshTokenStore.js";
import type { AccessTokenService, Clock } from "./ports.js";
import {
  ACCESS_TOKEN_TTL_MS,
  REFRESH_TOKEN_TTL_MS,
} from "./tokenPolicy.js";

const fixedNow = new Date("2024-01-01T00:00:00.000Z");

const clock: Clock = {
  now: () => fixedNow,
};

class FakeAccessTokenService implements AccessTokenService {
  private counter = 0;

  async create(userId: string, expiresAt: Date): Promise<string> {
    return `access-${userId}-${expiresAt.getTime()}-${this.counter++}`;
  }
}

describe("RefreshAccessToken", () => {
  it("rotates refresh tokens and returns new tokens", async () => {
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    const existing = await refreshTokenStore.create(
      "user-1",
      new Date(fixedNow.getTime() + REFRESH_TOKEN_TTL_MS)
    );

    const refresh = new RefreshAccessToken(
      accessTokenService,
      refreshTokenStore,
      clock
    );

    const result = await refresh.execute({ refreshToken: existing.token });

    expect(result.tokens.accessToken).toContain("user-1");
    expect(result.tokens.accessTokenExpiresAt).toEqual(
      new Date(fixedNow.getTime() + ACCESS_TOKEN_TTL_MS)
    );
    expect(result.tokens.refreshTokenExpiresAt).toEqual(
      new Date(fixedNow.getTime() + REFRESH_TOKEN_TTL_MS)
    );
    expect(result.tokens.refreshToken).not.toBe(existing.token);

    await expect(refreshTokenStore.find(existing.token)).resolves.toBeNull();
  });

  it("rejects invalid refresh tokens", async () => {
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    const refresh = new RefreshAccessToken(
      accessTokenService,
      refreshTokenStore,
      clock
    );

    await expect(
      refresh.execute({ refreshToken: "missing-token" })
    ).rejects.toMatchObject({ code: "invalid_refresh_token" });
  });

  it("rejects and revokes expired refresh tokens", async () => {
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const accessTokenService = new FakeAccessTokenService();

    const existing = await refreshTokenStore.create(
      "user-1",
      new Date(fixedNow.getTime() - 1000)
    );

    const refresh = new RefreshAccessToken(
      accessTokenService,
      refreshTokenStore,
      clock
    );

    await expect(
      refresh.execute({ refreshToken: existing.token })
    ).rejects.toMatchObject({ code: "invalid_refresh_token" });

    await expect(refreshTokenStore.find(existing.token)).resolves.toBeNull();
  });
});
