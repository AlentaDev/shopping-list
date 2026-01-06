import express from "express";
import { ZodError } from "zod";
import { createAuthModule } from "./modules/auth/authModule";
import { createCatalogModule } from "./modules/catalog/catalogModule";
import { createListsModule } from "./modules/lists/listsModule";
import { AppError } from "./shared/errors/appError";

type AppDependencies = {
  authModule?: ReturnType<typeof createAuthModule>;
  catalogModule?: ReturnType<typeof createCatalogModule>;
  listsModule?: ReturnType<typeof createListsModule>;
};

export function createApp(deps: AppDependencies = {}) {
  const app = express();

  app.use(express.json());

  // CORS configuration
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS"
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.header("Access-Control-Allow-Credentials", "true");

    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }

    next();
  });

  const authModule = deps.authModule ?? createAuthModule();
  app.use("/api/auth", authModule.router);

  const catalogModule = deps.catalogModule ?? createCatalogModule();
  app.use("/api/catalog", catalogModule.router);

  const listsModule =
    deps.listsModule ??
    createListsModule({
      sessionStore: authModule.sessionStore,
      catalogProvider: catalogModule.provider,
    });
  app.use("/api/lists", listsModule.router);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction
    ) => {
      if (error instanceof ZodError) {
        res
          .status(400)
          .json({ error: "validation_error", details: error.issues });
        return;
      }

      if (error instanceof AppError) {
        res.status(error.status).json({ error: error.code });
        return;
      }

      res.status(500).json({ error: "internal_server_error" });
    }
  );

  return app;
}
