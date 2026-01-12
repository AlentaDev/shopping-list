import { User } from "../domain/user";
import { RefreshTokenRecord } from "../domain/refreshToken";

export type UserRepository = {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
};

export type PasswordHasher = {
  hash(value: string): Promise<string>;
  compare(value: string, hashedValue: string): Promise<boolean>;
};

export type AccessTokenService = {
  create(userId: string, expiresAt: Date): Promise<string>;
};

export type RefreshTokenStore = {
  create(userId: string, expiresAt: Date): Promise<RefreshTokenRecord>;
  find(token: string): Promise<RefreshTokenRecord | null>;
  revoke(token: string): Promise<void>;
};

export type Clock = {
  now(): Date;
};
