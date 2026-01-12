import { createHmac, timingSafeEqual } from "node:crypto";

export type JwtPayload = {
  sub: string;
  exp: number;
};

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const [encodedHeader, encodedPayload, signature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signToken(
    `${encodedHeader}.${encodedPayload}`,
    secret
  );
  const signatureBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");
  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  const payload = decodeBase64Url<JwtPayload>(encodedPayload);
  if (!payload) {
    return null;
  }

  return payload;
}

function signToken(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

function decodeBase64Url<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}
