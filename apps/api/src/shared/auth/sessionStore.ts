export type SessionStore = {
  createSession(userId: string): Promise<string>;
  getUserId(sessionId: string): Promise<string | null>;
  deleteSession(sessionId: string): Promise<void>;
};
