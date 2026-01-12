import { Router } from "express";
import { createAuthModule } from "../modules/auth/authModule";
import { createCatalogModule } from "../modules/catalog/catalogModule";
import { createListsModule } from "../modules/lists/listsModule";
import { createUsersModule } from "../modules/users/usersModule";
import { InMemoryUserRepository } from "../modules/users/public";

export type RouterDependencies = {
  authModule?: ReturnType<typeof createAuthModule>;
  catalogModule?: ReturnType<typeof createCatalogModule>;
  listsModule?: ReturnType<typeof createListsModule>;
  usersModule?: ReturnType<typeof createUsersModule>;
};

export function buildRouter(deps: RouterDependencies = {}) {
  const router = Router();

  const userRepository =
    deps.authModule?.userRepository ??
    deps.usersModule?.userRepository ??
    new InMemoryUserRepository();
  const authModule =
    deps.authModule ?? createAuthModule({ userRepository });
  router.use("/auth", authModule.router);

  const catalogModule = deps.catalogModule ?? createCatalogModule();
  router.use("/catalog", catalogModule.router);

  const listsModule =
    deps.listsModule ??
    createListsModule({
      catalogProvider: catalogModule.provider,
    });
  router.use("/lists", listsModule.router);

  const usersModule =
    deps.usersModule ?? createUsersModule({ userRepository });
  router.use("/users", usersModule.router);

  return router;
}
