import { describe, expect, it } from "vitest";
import { InMemoryRefreshTokenRepository } from "../infrastructure/InMemoryRefreshTokenRepository";
import { RefreshAccessToken } from "./refreshAccessToken";
import { InvalidRefreshTokenError } from "./errors";
import { TokenGenerator } from "./ports";

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

describe("RefreshAccessToken", () => {
  it("rotates refresh token and returns new access token", async () => {
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    await refreshTokenRepository.save("old-refresh", "user-1");
    const tokenGenerator = new FakeTokenGenerator([
      "new-access",
      "new-refresh",
    ]);
    const refreshAccessToken = new RefreshAccessToken(
      refreshTokenRepository,
      tokenGenerator
    );

    const result = await refreshAccessToken.execute({
      refreshToken: "old-refresh",
    });

    expect(result.accessToken).toBe("new-access");
    expect(result.refreshToken).toBe("new-refresh");
    const oldTokenUserId = await refreshTokenRepository.findUserIdByToken(
      "old-refresh"
    );
    expect(oldTokenUserId).toBeNull();
    const newTokenUserId = await refreshTokenRepository.findUserIdByToken(
      "new-refresh"
    );
    expect(newTokenUserId).toBe("user-1");
  });

  it("rejects invalid refresh tokens", async () => {
    const refreshTokenRepository = new InMemoryRefreshTokenRepository();
    const tokenGenerator = new FakeTokenGenerator(["access", "refresh"]);
    const refreshAccessToken = new RefreshAccessToken(
      refreshTokenRepository,
      tokenGenerator
    );

    await expect(
      refreshAccessToken.execute({ refreshToken: "missing" })
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
