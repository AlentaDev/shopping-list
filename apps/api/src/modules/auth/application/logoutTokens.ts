import { RefreshTokenStore } from "./ports.js";

export class LogoutTokens {
  constructor(private readonly refreshTokenStore: RefreshTokenStore) {}

  async execute(refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      return;
    }

    await this.refreshTokenStore.revoke(refreshToken);
  }
}
