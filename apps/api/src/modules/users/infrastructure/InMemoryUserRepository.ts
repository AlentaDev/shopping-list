import type { Email } from "@src/core/value-objects/index.js";
import type { User } from "../domain/user.js";
import type { UserRepository } from "../application/ports.js";

export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly usersByEmail = new Map<Email, User>();

  async findByEmail(email: Email): Promise<User | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }
}
