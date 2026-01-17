import { randomUUID } from "node:crypto";
import type { User } from "@src/modules/users/public.js";
import { DuplicateEmailError } from "./errors.js";
import {
  AccessTokenService,
  Clock,
  PasswordHasher,
  RefreshTokenStore,
  UserRepository,
} from "./ports.js";
import { AuthTokens } from "./authTokens.js";
import {
  getAccessTokenExpiresAt,
  getRefreshTokenExpiresAt,
} from "./tokenPolicy.js";
import {
  toEmail,
  toName,
  toPostalCode,
} from "@src/core/value-objects/index.js";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  postalCode?: string;
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
    const email = toEmail(input.email);
    const name = toName(input.name);
    const postalCode = toPostalCode(input.postalCode ?? "");

    const existing = await this.userRepository.findByEmail(email);
    if (existing) {
      throw new DuplicateEmailError();
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const user: User = {
      id: randomUUID(),
      name,
      email,
      passwordHash,
      postalCode,
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
