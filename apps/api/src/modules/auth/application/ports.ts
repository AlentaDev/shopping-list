import { RefreshTokenRecord } from "../domain/refreshToken.js";
export type { UserRepository } from "@src/modules/users/public.js";

export type PasswordHasher = {
  hash(value: string): Promise<string>;
  compare(value: string, hashedValue: string): Promise<boolean>;
};

export type AccessTokenService = {
  create(userId: string, expiresAt: Date): Promise<string>;
};

export type RefreshTokenDeviceInfo = {
  fingerprint: string;
  userAgent: string | null;
};

export type RefreshTokenStore = {
  create(
    userId: string,
    expiresAt: Date,
    device: RefreshTokenDeviceInfo,
  ): Promise<RefreshTokenRecord>;
  find(token: string): Promise<RefreshTokenRecord | null>;
  revoke(token: string): Promise<void>;
};

export type Clock = {
  now(): Date;
};
