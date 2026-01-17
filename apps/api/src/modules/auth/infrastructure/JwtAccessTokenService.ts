import { createHmac } from "node:crypto";
import type { AccessTokenService } from "../application/ports.js";

type JwtPayload = {
  sub: string;
  exp: number;
};

const JWT_HEADER = {
  alg: "HS256",
  typ: "JWT",
} as const;

export class JwtAccessTokenService implements AccessTokenService {
  constructor(private readonly secret: string) {}

  async create(userId: string, expiresAt: Date): Promise<string> {
    const payload: JwtPayload = {
      sub: userId,
      exp: Math.floor(expiresAt.getTime() / 1000),
    };

    const header = encodeBase64Url(JSON.stringify(JWT_HEADER));
    const body = encodeBase64Url(JSON.stringify(payload));
    const signature = signToken(`${header}.${body}`, this.secret);

    return `${header}.${body}.${signature}`;
  }
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function signToken(input: string, secret: string): string {
  return createHmac("sha256", secret).update(input).digest("base64url");
}
