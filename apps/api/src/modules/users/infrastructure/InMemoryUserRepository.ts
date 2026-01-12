import { User } from "../domain/user";
import { UserRepository } from "../application/ports";

export class InMemoryUserRepository implements UserRepository {
  private readonly usersById = new Map<string, User>();
  private readonly usersByEmail = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
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
