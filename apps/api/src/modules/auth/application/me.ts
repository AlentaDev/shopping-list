import { NotAuthenticatedError } from "./errors";
import { UserRepository } from "./ports";
import { User } from "../domain/user";

export class GetCurrentUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string | null): Promise<User> {
    if (!userId) {
      throw new NotAuthenticatedError();
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotAuthenticatedError();
    }

    return user;
  }
}
