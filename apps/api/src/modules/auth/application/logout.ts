import { SessionStore } from "./ports";

export class LogoutUser {
  constructor(private readonly sessionStore: SessionStore) {}

  async execute(sessionId: string | null): Promise<void> {
    if (!sessionId) {
      return;
    }

    await this.sessionStore.deleteSession(sessionId);
  }
}
