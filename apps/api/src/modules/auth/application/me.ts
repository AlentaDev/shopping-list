import { NotAuthenticatedError } from "./errors";
import { SessionStore, UserRepository } from "./ports";
import { User } from "../domain/user";

export class GetCurrentUser {
  constructor(
    private readonly sessionStore: SessionStore,
    private readonly userRepository: UserRepository
  ) {}

  async execute(sessionId: string | null): Promise<User> {
    if (!sessionId) {
      throw new NotAuthenticatedError();
    }

    const userId = await this.sessionStore.getUserId(sessionId);
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
