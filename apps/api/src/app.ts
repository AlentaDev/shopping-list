import express from "express";
import { buildRouter, type RouterDependencies } from "@src/app/router.js";
import { errorMiddleware } from "@src/app/errors/errorMiddleware.js";
import {
  createCorsMiddleware,
  resolveAllowedOriginsFromEnv,
} from "@src/shared/web/corsMiddleware.js";

export function createApp(deps: RouterDependencies = {}) {
  const app = express();

  app.use(express.json());

  app.use(createCorsMiddleware(resolveAllowedOriginsFromEnv()));

  app.use("/api", buildRouter(deps));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    app.get("/debug/sentry", () => {
      throw new Error("Sentry test error from /debug/sentry");
    });
  }

  app.use(errorMiddleware);

  return app;
}
