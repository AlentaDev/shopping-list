import { InvalidCredentialsError } from "./errors.js";
import {
  AccessTokenService,
  Clock,
  PasswordHasher,
  RefreshTokenDeviceInfo,
  RefreshTokenStore,
  UserRepository,
} from "./ports.js";
import type { User } from "@src/modules/users/public.js";
import { AuthTokens } from "./authTokens.js";
import {
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
} from "./tokenPolicy.js";
import { toEmail } from "@src/core/value-objects/index.js";

export type LoginInput = {
  email: string;
  password: string;
  device: RefreshTokenDeviceInfo;
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
    private readonly clock: Clock,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const email = toEmail(input.email);
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isValid = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new InvalidCredentialsError();
    }

    const now = this.clock.now();
    const accessTokenExpiresAt = getAccessTokenExpiresAt(now);
    const refreshTokenExpiresAt = getRefreshTokenExpiresAt(now);

    const accessToken = await this.accessTokenService.create(
      user.id,
      accessTokenExpiresAt,
    );
    const refreshRecord = await this.refreshTokenStore.create(
      user.id,
      refreshTokenExpiresAt,
      input.device,
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
