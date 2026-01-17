import { AppError } from "@src/shared/errors/appError.js";
import { API_ERROR_MESSAGES } from "@src/shared/constants/apiErrorMessages.js";
import type { User } from "../domain/user.js";
import type { UserRepository } from "./ports.js";

export class GetCurrentUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(userId: string | null): Promise<User> {
    if (!userId) {
      throw new AppError(
        401,
        "not_authenticated",
        API_ERROR_MESSAGES.notAuthenticated
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(
        401,
        "not_authenticated",
        API_ERROR_MESSAGES.notAuthenticated
      );
    }

    return user;
  }
}
