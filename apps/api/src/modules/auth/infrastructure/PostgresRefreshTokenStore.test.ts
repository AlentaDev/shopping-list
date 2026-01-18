import { describe, expect, it, vi } from "vitest";
import { PostgresRefreshTokenStore } from "./PostgresRefreshTokenStore.js";

describe("PostgresRefreshTokenStore", () => {
  it("creates a refresh token and revokes the previous one for the device", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    const store = new PostgresRefreshTokenStore(pool);
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");

    const record = await store.create("user-1", expiresAt, {
      fingerprint: "device-1",
      userAgent: "TestAgent/1.0",
    });

    expect(pool.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      "UPDATE refresh_tokens SET revoked_at = $1 WHERE user_id = $2 AND fingerprint = $3 AND revoked_at IS NULL",
      [expect.any(Date), "user-1", "device-1"],
    );
    expect(pool.query).toHaveBeenNthCalledWith(
      3,
      "INSERT INTO refresh_tokens (token, user_id, fingerprint, user_agent, expires_at, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
      [
        expect.any(String),
        "user-1",
        "device-1",
        "TestAgent/1.0",
        expiresAt,
        expect.any(Date),
      ],
    );
    expect(pool.query).toHaveBeenNthCalledWith(4, "COMMIT");
    expect(record).toMatchObject({
      userId: "user-1",
      fingerprint: "device-1",
      userAgent: "TestAgent/1.0",
      expiresAt,
    });
  });

  it("returns a refresh token record when found", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            token: "token-1",
            user_id: "user-1",
            fingerprint: "device-1",
            user_agent: "TestAgent/1.0",
            expires_at: "2030-01-01T00:00:00.000Z",
            created_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      }),
    };
    const store = new PostgresRefreshTokenStore(pool);

    await expect(store.find("token-1")).resolves.toEqual({
      token: "token-1",
      userId: "user-1",
      fingerprint: "device-1",
      userAgent: "TestAgent/1.0",
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    });
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT token, user_id, fingerprint, user_agent, expires_at, created_at FROM refresh_tokens WHERE token = $1 AND revoked_at IS NULL",
      ["token-1"],
    );
  });

  it("returns null when the refresh token does not exist", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    const store = new PostgresRefreshTokenStore(pool);

    await expect(store.find("missing-token")).resolves.toBeNull();
  });

  it("revokes a refresh token by marking it revoked", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    const store = new PostgresRefreshTokenStore(pool);

    await store.revoke("token-1");

    expect(pool.query).toHaveBeenCalledWith(
      "UPDATE refresh_tokens SET revoked_at = $1 WHERE token = $2 AND revoked_at IS NULL",
      [expect.any(Date), "token-1"],
    );
  });
});
