import { InvalidRefreshTokenError } from "./errors.js";
import { AuthTokens } from "./authTokens.js";
import {
  AccessTokenService,
  Clock,
  RefreshTokenStore,
} from "./ports.js";
import {
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
} from "./tokenPolicy.js";

export type RefreshInput = {
  refreshToken: string;
};

export type RefreshResult = {
  tokens: AuthTokens;
};

export class RefreshAccessToken {
  constructor(
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenStore: RefreshTokenStore,
    private readonly clock: Clock
  ) {}

  async execute(input: RefreshInput): Promise<RefreshResult> {
    const record = await this.refreshTokenStore.find(input.refreshToken);
    if (!record) {
      throw new InvalidRefreshTokenError();
    }

    const now = this.clock.now();
    if (record.expiresAt.getTime() <= now.getTime()) {
      await this.refreshTokenStore.revoke(record.token);
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokenStore.revoke(record.token);

    const accessTokenExpiresAt = getAccessTokenExpiresAt(now);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt(now);

    const accessToken = await this.accessTokenService.create(
      record.userId,
      accessTokenExpiresAt
    );
    const newRefresh = await this.refreshTokenStore.create(
      record.userId,
      refreshTokenExpiresAt
    );

    return {
      tokens: {
        accessToken,
        refreshToken: newRefresh.token,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      },
    };
  }
}
