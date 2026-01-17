import express from "express";
import { buildRouter, type RouterDependencies } from "@src/app/router.js";
import { errorMiddleware } from "@src/app/errors/errorMiddleware.js";

export function createApp(deps: RouterDependencies = {}) {
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

  app.use("/api", buildRouter(deps));

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  app.use(errorMiddleware);

  return app;
}
