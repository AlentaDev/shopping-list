import { describe, expect, it } from "vitest";
import { InMemoryRefreshTokenStore } from "../infrastructure/InMemoryRefreshTokenStore.js";
import { SystemClock } from "../infrastructure/SystemClock.js";
import { LogoutTokens } from "./logoutTokens.js";
import { getRefreshTokenExpiresAt } from "./tokenPolicy.js";

describe("LogoutTokens", () => {
  it("revokes the refresh token when present", async () => {
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const clock = new SystemClock();
    const useCase = new LogoutTokens(refreshTokenStore);
    const expiresAt = getRefreshTokenExpiresAt(clock.now());

    const record = await refreshTokenStore.create("user-1", expiresAt);

    await useCase.execute(record.token);

    await expect(refreshTokenStore.find(record.token)).resolves.toBeNull();
  });

  it("ignores missing refresh token", async () => {
    const refreshTokenStore = new InMemoryRefreshTokenStore();
    const useCase = new LogoutTokens(refreshTokenStore);

    await expect(useCase.execute(null)).resolves.toBeUndefined();
  });
});
