import { randomUUID } from "node:crypto";
import type { AccessTokenService } from "../application/ports.js";

export class InMemoryAccessTokenService implements AccessTokenService {
  async create(_userId: string, _expiresAt: Date): Promise<string> {
    return randomUUID();
  }
}
