import { RefreshTokenRepository } from "../application/ports";

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  private readonly tokens = new Map<string, string>();

  async save(token: string, userId: string): Promise<void> {
    this.tokens.set(token, userId);
  }

  async findUserIdByToken(token: string): Promise<string | null> {
    return this.tokens.get(token) ?? null;
  }

  async delete(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}
