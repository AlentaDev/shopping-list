import { GetCurrentUser } from "./application/getCurrentUser";
import type { UserRepository } from "./application/ports";
import { InMemoryUserRepository } from "./infrastructure/InMemoryUserRepository";
import { createUsersRouter } from "./api/usersRouter";
import { requireAuth } from "../../shared/web/requireAuth";

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
