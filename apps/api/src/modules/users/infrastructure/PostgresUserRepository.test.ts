import {
  toEmail,
  toName,
  toPostalCode,
} from "@src/core/value-objects/index.js";
import { describe, expect, it, vi } from "vitest";
import { PostgresUserRepository } from "./PostgresUserRepository.js";

const user = {
  id: "user-123",
  name: toName("Test User"),
  email: toEmail("test@example.com"),
  passwordHash: "hashed-password",
  postalCode: toPostalCode("12345"),
};

describe("PostgresUserRepository", () => {
  it("returns a user when found by id", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: user.id,
            name: "Test User",
            email: "test@example.com",
            password_hash: "hashed-password",
            postal_code: "12345",
          },
        ],
      }),
    };
    const repository = new PostgresUserRepository(pool);

    await expect(repository.findById(user.id)).resolves.toEqual(user);
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, name, email, password_hash, postal_code FROM users WHERE id = $1",
      [user.id],
    );
  });

  it("returns a user when found by email", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            id: user.id,
            name: "Test User",
            email: "test@example.com",
            password_hash: "hashed-password",
            postal_code: "12345",
          },
        ],
      }),
    };
    const repository = new PostgresUserRepository(pool);

    await expect(repository.findByEmail(user.email)).resolves.toEqual(user);
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, name, email, password_hash, postal_code FROM users WHERE email = $1",
      [user.email],
    );
  });

  it("returns null when no user is found", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    const repository = new PostgresUserRepository(pool);

    await expect(repository.findById("missing-id")).resolves.toBeNull();
    await expect(
      repository.findByEmail(toEmail("missing@example.com")),
    ).resolves.toBeNull();
  });

  it("saves the user using an upsert", async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({ rows: [] }),
    };
    const repository = new PostgresUserRepository(pool);

    await repository.save(user);

    expect(pool.query).toHaveBeenCalledWith(
      "INSERT INTO users (id, name, email, password_hash, postal_code) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, postal_code = EXCLUDED.postal_code",
      [
        user.id,
        user.name,
        user.email,
        user.passwordHash,
        user.postalCode,
      ],
    );
  });
});
