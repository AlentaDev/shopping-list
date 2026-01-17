import { API_ERROR_MESSAGES } from "@src/shared/constants/apiErrorMessages.js";
import { AppError } from "@src/shared/errors/appError.js";
import {
  toEmail,
  toName,
  toPostalCode,
} from "@src/core/value-objects/index.js";
import { InMemoryUserRepository } from "../infrastructure/InMemoryUserRepository.js";
import { GetCurrentUser } from "./getCurrentUser.js";

const user = {
  id: "user-123",
  name: toName("Test User"),
  email: toEmail("test@example.com"),
  passwordHash: "hashed-password",
  postalCode: toPostalCode("12345"),
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
      new AppError(
        401,
        "not_authenticated",
        API_ERROR_MESSAGES.notAuthenticated
      )
    );
  });

  it("throws when the user does not exist", async () => {
    const repository = new InMemoryUserRepository();
    const getCurrentUser = new GetCurrentUser(repository);

    await expect(getCurrentUser.execute("missing-user")).rejects.toMatchObject(
      new AppError(
        401,
        "not_authenticated",
        API_ERROR_MESSAGES.notAuthenticated
      )
    );
  });
});
