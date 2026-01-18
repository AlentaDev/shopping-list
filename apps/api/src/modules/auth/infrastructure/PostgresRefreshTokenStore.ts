import { randomUUID } from "node:crypto";
import type {
  RefreshTokenDeviceInfo,
  RefreshTokenStore,
} from "../application/ports.js";
import type { RefreshTokenRecord } from "../domain/refreshToken.js";

type PgPool = {
  query: (
    text: string,
    params?: ReadonlyArray<unknown>,
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

export class PostgresRefreshTokenStore implements RefreshTokenStore {
  constructor(private readonly pool: PgPool) {}

  async create(
    userId: string,
    expiresAt: Date,
    device: RefreshTokenDeviceInfo,
  ): Promise<RefreshTokenRecord> {
    const token = randomUUID();
    const createdAt = new Date();

    await this.pool.query("BEGIN");
    try {
      await this.pool.query(
        "UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND fingerprint = $3 AND revoked_at IS NULL",
        [createdAt, userId, device.fingerprint],
      );

      await this.pool.query(
        "INSERT INTO refresh_tokens (token, user_id, fingerprint, user_agent, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          token,
          userId,
          device.fingerprint,
          device.userAgent,
          expiresAt,
          createdAt,
        ],
      );

      await this.pool.query("COMMIT");
    } catch (error) {
      await this.pool.query("ROLLBACK");
      throw error;
    }

    return {
      token,
      userId,
      fingerprint: device.fingerprint,
      userAgent: device.userAgent,
      expiresAt,
      createdAt,
    };
  }

  async find(token: string): Promise<RefreshTokenRecord | null> {
    const result = await this.pool.query(
      "SELECT token, user_id, fingerprint, user_agent, expires_at, created_at FROM refresh_tokens WHERE token = $1 AND revoked_at IS NULL",
      [token],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];

    return {
      token: String(row.token),
      userId: String(row.user_id),
      fingerprint: String(row.fingerprint),
      userAgent: row.user_agent ? String(row.user_agent) : null,
      expiresAt: new Date(String(row.expires_at)),
      createdAt: new Date(String(row.created_at)),
    };
  }

  async revoke(token: string): Promise<void> {
    await this.pool.query(
      "UPDATE refresh_tokens SET revoked_at = $1 WHERE token = $2 AND revoked_at IS NULL",
      [new Date(), token],
    );
  }
}
