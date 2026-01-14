import type { Email } from "../../../core/value-objects";
import type { User } from "../domain/user";

export type UserRepository = {
  findByEmail(email: Email): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
};
