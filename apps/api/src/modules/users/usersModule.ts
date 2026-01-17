import { GetCurrentUser } from "./application/getCurrentUser.js";
import type { UserRepository } from "./application/ports.js";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository.js";
import { createUsersRouter } from "./api/usersRouter.js";
import { requireAuth } from "@src/shared/web/requireAuth.js";

type UsersModuleDependencies = {
  userRepository?: UserRepository;
};

export function createUsersModule(deps: UsersModuleDependencies = {}) {
  const userRepository = deps.userRepository ?? new InMemoryUserRepository();
  const getCurrentUser = new GetCurrentUser(userRepository);

  const router = createUsersRouter({
    requireAuth: requireAuth(),
    getCurrentUser,
  });

  return { router, userRepository };
}
