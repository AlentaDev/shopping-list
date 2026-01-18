import { randomUUID } from "node:crypto";
import { RefreshTokenRecord } from "../domain/refreshToken.js";
import {
  RefreshTokenDeviceInfo,
  RefreshTokenStore,
} from "../application/ports.js";

export class InMemoryRefreshTokenStore implements RefreshTokenStore {
  private readonly tokens = new Map<string, RefreshTokenRecord>();

  // TODO(PROD): Replace in-memory refresh token store with persistent storage.

  async create(
    userId: string,
    expiresAt: Date,
    device: RefreshTokenDeviceInfo,
  ): Promise<RefreshTokenRecord> {
    const token = randomUUID();
    const record: RefreshTokenRecord = {
      token,
      userId,
      fingerprint: device.fingerprint,
      userAgent: device.userAgent,
      expiresAt,
      createdAt: new Date(),
    };
    this.tokens.set(token, record);
    return record;
  }

  async find(token: string): Promise<RefreshTokenRecord | null> {
    return this.tokens.get(token) ?? null;
  }

  async revoke(token: string): Promise<void> {
    this.tokens.delete(token);
  }
}
