import { User } from "../domain/user";
import type { SessionStore } from "../../../shared/auth/sessionStore";

export type UserRepository = {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
};

export type PasswordHasher = {
  hash(value: string): Promise<string>;
  compare(value: string, hashedValue: string): Promise<boolean>;
};

export type RefreshTokenRepository = {
  save(token: string, userId: string): Promise<void>;
  findUserIdByToken(token: string): Promise<string | null>;
  delete(token: string): Promise<void>;
};

export type TokenGenerator = {
  generate(): string;
};

export type { SessionStore };
