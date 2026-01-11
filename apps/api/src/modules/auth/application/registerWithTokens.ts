import { randomUUID } from "node:crypto";
import { User } from "../domain/user";
import { DuplicateEmailError } from "./errors";
import {
  AccessTokenService,
  Clock,
  PasswordHasher,
  RefreshTokenStore,
  UserRepository,
} from "./ports";
import { AuthTokens } from "./authTokens";
import {
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
} from "./tokenPolicy";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
};

export type RegisterResult = {
  user: User;
  tokens: AuthTokens;
};

export class RegisterWithTokens {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenStore: RefreshTokenStore,
    private readonly clock: Clock
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new DuplicateEmailError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
      postalCode: input.postalCode,
    };

    await this.userRepository.save(user);

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
