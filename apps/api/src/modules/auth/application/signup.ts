import { randomUUID } from "node:crypto";
import { User } from "../domain/user";
import { DuplicateEmailError } from "./errors";
import { PasswordHasher, UserRepository } from "./ports";

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
};

export class SignupUser {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher
  ) {}

  async execute(input: SignupInput): Promise<User> {
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

    return user;
  }
}
