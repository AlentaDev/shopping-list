import express from "express";
import { ZodError } from "zod";
import { createAuthModule } from "./modules/auth/authModule";
import { AppError } from "./shared/errors/appError";

export function createApp() {
  const app = express();

  app.use(express.json());

  const authModule = createAuthModule();
  app.use("/api/auth", authModule.router);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: "validation_error", details: error.issues });
      return;
    }

    if (error instanceof AppError) {
      res.status(error.status).json({ error: error.code });
      return;
    }

    res.status(500).json({ error: "internal_server_error" });
  });

  return app;
}
