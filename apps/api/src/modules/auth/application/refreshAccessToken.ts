import { InvalidRefreshTokenError } from "./errors";
import { RefreshTokenRepository, TokenGenerator } from "./ports";

export type RefreshAccessTokenInput = {
  refreshToken: string;
};

export type RefreshAccessTokenResult = {
  accessToken: string;
  refreshToken: string;
};

export class RefreshAccessToken {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(
    input: RefreshAccessTokenInput
  ): Promise<RefreshAccessTokenResult> {
    const userId = await this.refreshTokenRepository.findUserIdByToken(
      input.refreshToken
    );
    if (!userId) {
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokenRepository.delete(input.refreshToken);

    const accessToken = this.tokenGenerator.generate();
    const refreshToken = this.tokenGenerator.generate();
    await this.refreshTokenRepository.save(refreshToken, userId);

    return { accessToken, refreshToken };
  }
}
