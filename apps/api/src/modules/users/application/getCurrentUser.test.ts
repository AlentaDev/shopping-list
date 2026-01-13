import { AppError } from "../../../shared/errors/appError";
import { InMemoryUserRepository } from "../infrastructure/InMemoryUserRepository";
import { GetCurrentUser } from "./getCurrentUser";

const user = {
  id: "user-123",
  name: "Test User",
  email: "test@example.com",
  passwordHash: "hashed-password",
  postalCode: "12345",
};

describe("GetCurrentUser", () => {
  it("returns the user when the id exists", async () => {
    const repository = new InMemoryUserRepository();
    await repository.save(user);

    const getCurrentUser = new GetCurrentUser(repository);

    await expect(getCurrentUser.execute(user.id)).resolves.toEqual(user);
  });

  it("throws when the user id is missing", async () => {
    const repository = new InMemoryUserRepository();
    const getCurrentUser = new GetCurrentUser(repository);

    await expect(getCurrentUser.execute(null)).rejects.toMatchObject(
      new AppError(401, "not_authenticated", "Not authenticated")
    );
  });

  it("throws when the user does not exist", async () => {
    const repository = new InMemoryUserRepository();
    const getCurrentUser = new GetCurrentUser(repository);

    await expect(getCurrentUser.execute("missing-user")).rejects.toMatchObject(
      new AppError(401, "not_authenticated", "Not authenticated")
    );
  });
});
