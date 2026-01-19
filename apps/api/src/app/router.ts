import { Router } from "express";
import { createAuthModule } from "@src/modules/auth/authModule.js";
import { createCatalogModule } from "@src/modules/catalog/catalogModule.js";
import { createListsModule } from "@src/modules/lists/listsModule.js";
import { createUsersModule } from "@src/modules/users/usersModule.js";
import { createPersistenceLayer } from "@src/app/persistence.js";

export type RouterDependencies = {
  authModule?: ReturnType<typeof createAuthModule>;
  catalogModule?: ReturnType<typeof createCatalogModule>;
  listsModule?: ReturnType<typeof createListsModule>;
  usersModule?: ReturnType<typeof createUsersModule>;
};

export function buildRouter(deps: RouterDependencies = {}) {
  const router = Router();
  const needsPersistence =
    !deps.authModule || !deps.usersModule || !deps.listsModule;
  const persistence = needsPersistence ? createPersistenceLayer() : null;

  const userRepository =
    deps.authModule?.userRepository ??
    deps.usersModule?.userRepository ??
    persistence?.userRepository;
  if (!userRepository) {
    throw new Error("User repository not configured.");
  }
  const authModule =
    deps.authModule ??
    createAuthModule({
      userRepository,
      refreshTokenStore: persistence?.refreshTokenStore,
    });
  router.use("/auth", authModule.router);

  const catalogModule = deps.catalogModule ?? createCatalogModule();
  router.use("/catalog", catalogModule.router);

  const listsModule =
    deps.listsModule ??
    createListsModule({
      catalogProvider: catalogModule.provider,
      listRepository: persistence?.listRepository,
    });
  router.use("/lists", listsModule.router);

  const usersModule = deps.usersModule ?? createUsersModule({ userRepository });
  router.use("/users", usersModule.router);

  return router;
}
