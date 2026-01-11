import { randomUUID } from "node:crypto";
import { User } from "../domain/user";
import { DuplicateEmailError, InvalidPasswordError } from "./errors";
import {
  PasswordHasher,
  RefreshTokenRepository,
  TokenGenerator,
  UserRepository,
} from "./ports";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
};

export type RegisterResult = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export class RegisterUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenGenerator: TokenGenerator
  ) {}

  async execute(input: RegisterInput): Promise<RegisterResult> {
    if (!input.password) {
      throw new InvalidPasswordError();
    }

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

    const accessToken = this.tokenGenerator.generate();
    const refreshToken = this.tokenGenerator.generate();
    await this.refreshTokenRepository.save(refreshToken, user.id);

    return { user, accessToken, refreshToken };
  }
}
