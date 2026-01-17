import type { Email } from "@src/core/value-objects/index.js";
import type { User } from "../domain/user.js";

export type UserRepository = {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
};
