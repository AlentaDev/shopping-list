import { randomUUID } from "node:crypto";
import { SessionStore } from "../application/ports";

export class InMemorySessionStore implements SessionStore {
  private readonly sessions = new Map<string, string>();

  async createSession(userId: string): Promise<string> {
    const sessionId = randomUUID();
    this.sessions.set(sessionId, userId);
    return sessionId;
  }

  async getUserId(sessionId: string): Promise<string | null> {
    return this.sessions.get(sessionId) ?? null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }
}
