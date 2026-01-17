import {
  toEmail,
  toName,
  toPostalCode,
} from "@src/core/value-objects/index.js";
import { InMemoryUserRepository } from "./InMemoryUserRepository.js";

const user = {
  id: "user-123",
  name: toName("Test User"),
  email: toEmail("test@example.com"),
  passwordHash: "hashed-password",
  postalCode: toPostalCode("12345"),
};

describe("InMemoryUserRepository", () => {
  it("saves and retrieves a user by id and email", async () => {
    const repository = new InMemoryUserRepository();

    await repository.save(user);

    await expect(repository.findById(user.id)).resolves.toEqual(user);
    await expect(repository.findByEmail(user.email)).resolves.toEqual(user);
  });

  it("returns null when no user is stored", async () => {
    const repository = new InMemoryUserRepository();

    await expect(repository.findById("missing-id")).resolves.toBeNull();
    await expect(
      repository.findByEmail(toEmail("missing@example.com"))
    ).resolves.toBeNull();
  });
});
