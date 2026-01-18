import { InMemoryRefreshTokenStore } from "./InMemoryRefreshTokenStore.js";

describe("InMemoryRefreshTokenStore", () => {
  it("creates and retrieves a refresh token record", async () => {
    const store = new InMemoryRefreshTokenStore();
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");

    const record = await store.create("user-123", expiresAt, {
      fingerprint: "device-1",
      userAgent: "TestAgent/1.0",
    });
    const storedRecord = await store.find(record.token);

    expect(storedRecord).toEqual(record);
    expect(storedRecord).toEqual({
      token: expect.any(String),
      userId: "user-123",
      fingerprint: "device-1",
      userAgent: "TestAgent/1.0",
      expiresAt,
      createdAt: expect.any(Date),
    });
  });

  it("revokes a refresh token", async () => {
    const store = new InMemoryRefreshTokenStore();
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");

    const record = await store.create("user-123", expiresAt, {
      fingerprint: "device-1",
      userAgent: "TestAgent/1.0",
    });
    await store.revoke(record.token);

    const storedRecord = await store.find(record.token);

    expect(storedRecord).toBeNull();
  });
});
