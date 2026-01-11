import { InvalidCredentialsError } from "./errors";
import { PasswordHasher, SessionStore, UserRepository } from "./ports";
import { User } from "../domain/user";

export type LoginInput = {
  email: string;
  password: string;
};

export type LoginResult = {
  user: User;
  sessionId: string;
};

export class LoginUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly sessionStore: SessionStore
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

    return { user, sessionId };
  }
}
