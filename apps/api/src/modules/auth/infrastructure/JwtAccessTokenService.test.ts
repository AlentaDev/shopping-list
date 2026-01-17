import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { JwtAccessTokenService } from "./JwtAccessTokenService.js";

const TEST_SECRET = "test-secret";

describe("JwtAccessTokenService", () => {
  it("creates a signed JWT with subject and exp", async () => {
    const service = new JwtAccessTokenService(TEST_SECRET);
    const expiresAt = new Date("2030-01-01T00:00:00.000Z");

    const token = await service.create("user-123", expiresAt);

    const [encodedHeader, encodedPayload, signature] = token.split(".");
    expect(encodedHeader).toBeTruthy();
    expect(encodedPayload).toBeTruthy();
    expect(signature).toBeTruthy();

    const header = decodeBase64Url(encodedHeader);
    const payload = decodeBase64Url(encodedPayload);

    expect(header).toEqual({ alg: "HS256", typ: "JWT" });
    expect(payload.sub).toBe("user-123");
    expect(payload.exp).toBe(Math.floor(expiresAt.getTime() / 1000));

    const expectedSignature = signToken(
      `${encodedHeader}.${encodedPayload}`,
      TEST_SECRET
    );
    expect(signature).toBe(expectedSignature);
  });
});

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
}

function signToken(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}
