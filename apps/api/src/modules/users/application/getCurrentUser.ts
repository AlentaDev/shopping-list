import { AppError } from "../../../shared/errors/appError";
import type { User } from "../domain/user";
import type { UserRepository } from "./ports";

export class GetCurrentUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string | null): Promise<User> {
    if (!userId) {
      throw new AppError(401, "not_authenticated", "Not authenticated");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(401, "not_authenticated", "Not authenticated");
    }

    return user;
  }
}
