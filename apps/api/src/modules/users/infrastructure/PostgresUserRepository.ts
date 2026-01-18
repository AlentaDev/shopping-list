import {
  toEmail,
  toName,
  toPostalCode,
} from "@src/core/value-objects/index.js";
import type { Email } from "@src/core/value-objects/index.js";
import type { UserRepository } from "../application/ports.js";
import type { User } from "../domain/user.js";

type PgPool = {
  query: (
    text: string,
    params?: ReadonlyArray<unknown>,
  ) => Promise<{ rows: Array<Record<string, unknown>> }>;
};

const USER_COLUMNS =
  "id, name, email, password_hash, postal_code" as const;

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly pool: PgPool) {}

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE email = $1`,
      [email],
    );

    return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.pool.query(
      `SELECT ${USER_COLUMNS} FROM users WHERE id = $1`,
      [id],
    );

    return result.rows.length > 0 ? mapRowToUser(result.rows[0]) : null;
  }

  async save(user: User): Promise<void> {
    await this.pool.query(
      "INSERT INTO users (id, name, email, password_hash, postal_code) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, postal_code = EXCLUDED.postal_code",
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.postalCode,
      ],
    );
  }
}

function mapRowToUser(row: Record<string, unknown>): User {
  return {
    id: String(row.id),
    name: toName(String(row.name)),
    email: toEmail(String(row.email)),
    passwordHash: String(row.password_hash),
    postalCode: toPostalCode(String(row.postal_code)),
  };
}
