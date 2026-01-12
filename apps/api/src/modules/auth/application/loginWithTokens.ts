import { InvalidCredentialsError } from "./errors";
import {
  AccessTokenService,
  Clock,
  PasswordHasher,
  RefreshTokenStore,
  UserRepository,
} from "./ports";
import type { User } from "../../users/public";
import { AuthTokens } from "./authTokens";
import {
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
} from "./tokenPolicy";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  user: User;
  tokens: AuthTokens;
};

export class LoginWithTokens {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenStore: RefreshTokenStore,
    private readonly clock: Clock
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash
    );
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const now = this.clock.now();
    const accessTokenExpiresAt = getAccessTokenExpiresAt(now);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt(now);

    const accessToken = await this.accessTokenService.create(
      user.id,
      accessTokenExpiresAt
    );
    const refreshRecord = await this.refreshTokenStore.create(
      user.id,
      refreshTokenExpiresAt
    );

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: refreshRecord.token,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
      },
    };
  }
}
