import { Router } from "express";
import { createAuthModule } from "../modules/auth/authModule";
import { createCatalogModule } from "../modules/catalog/catalogModule";
import { createListsModule } from "../modules/lists/listsModule";

export type RouterDependencies = {
  authModule?: ReturnType<typeof createAuthModule>;
  catalogModule?: ReturnType<typeof createCatalogModule>;
  listsModule?: ReturnType<typeof createListsModule>;
};

export function buildRouter(deps: RouterDependencies = {}) {
  const router = Router();

  const authModule = deps.authModule ?? createAuthModule();
  router.use("/auth", authModule.router);

  const catalogModule = deps.catalogModule ?? createCatalogModule();
  router.use("/catalog", catalogModule.router);

  const listsModule =
    deps.listsModule ??
    createListsModule({
      catalogProvider: catalogModule.provider,
    });
  router.use("/lists", listsModule.router);

  return router;
}
