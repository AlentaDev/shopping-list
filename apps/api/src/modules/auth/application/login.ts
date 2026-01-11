import { InvalidCredentialsError } from "./errors";
import {
  PasswordHasher,
  RefreshTokenRepository,
  SessionStore,
  TokenGenerator,
  UserRepository,
} from "./ports";
import { User } from "../domain/user";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  user: User;
  sessionId: string;
  accessToken: string;
  refreshToken: string;
};

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionStore: SessionStore,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenGenerator: TokenGenerator
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

    const sessionId = await this.sessionStore.createSession(user.id);
    const accessToken = this.tokenGenerator.generate();
    const refreshToken = this.tokenGenerator.generate();
    await this.refreshTokenRepository.save(refreshToken, user.id);

    return { user, sessionId, accessToken, refreshToken };
  }
}
