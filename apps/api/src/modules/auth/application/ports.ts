import { User } from "../domain/user";

export type UserRepository = {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
};

export type PasswordHasher = {
  hash(value: string): Promise<string>;
  compare(value: string, hashedValue: string): Promise<boolean>;
};

export type SessionStore = {
  createSession(userId: string): Promise<string>;
  getUserId(sessionId: string): Promise<string | null>;
  deleteSession(sessionId: string): Promise<void>;
};
