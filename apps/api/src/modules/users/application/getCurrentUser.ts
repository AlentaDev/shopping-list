import { AppError } from "../../../shared/errors/appError";
import { API_ERROR_MESSAGES } from "../../../shared/constants/apiErrorMessages";
import type { User } from "../domain/user";
import type { UserRepository } from "./ports";

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
