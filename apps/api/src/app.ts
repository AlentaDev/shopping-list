import express from "express";
import { buildRouter, type RouterDependencies } from "@src/app/router.js";
import { errorMiddleware } from "@src/app/errors/errorMiddleware.js";

export function createApp(deps: RouterDependencies = {}) {
  const app = express();

  app.use(express.json());

  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";

  if (allowedOrigins.length === 0 && !isTestEnv) {
    throw new Error(
      "CORS configuration missing. Set ALLOWED_ORIGINS (preferred) or CORS_ORIGIN.",
    );
  }

  const isOriginAllowed = (origin: string) => allowedOrigins.includes(origin);

  // CORS configuration
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
      if (!isOriginAllowed(origin)) {
        if (req.method === "OPTIONS") {
          return res.sendStatus(403);
        }

        return res.status(403).json({ error: "origin_not_allowed" });
      }

      res.header("Access-Control-Allow-Origin", origin);
      res.header("Vary", "Origin");
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  });

  app.use("/api", buildRouter(deps));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(errorMiddleware);

  return app;
}
