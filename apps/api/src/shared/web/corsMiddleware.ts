import type { Request, Response, NextFunction } from "express";

const ALLOWED_METHODS = "GET, POST, PUT, DELETE, PATCH, OPTIONS";
const ALLOWED_HEADERS = "Origin, X-Requested-With, Content-Type, Accept, Authorization";

export function resolveAllowedOriginsFromEnv(env: NodeJS.ProcessEnv = process.env): string[] {
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? env.CORS_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const isTestEnv = env.NODE_ENV === "test" || env.VITEST === "true";

  if (allowedOrigins.length === 0 && !isTestEnv) {
    throw new Error(
      "CORS configuration missing. Set ALLOWED_ORIGINS (preferred) or CORS_ORIGIN.",
    );
  }

  return allowedOrigins;
}

export function createCorsMiddleware(allowedOrigins: string[]) {
  const isOriginAllowed = (origin: string) => allowedOrigins.includes(origin);

  return (req: Request, res: Response, next: NextFunction) => {
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

    res.header("Access-Control-Allow-Methods", ALLOWED_METHODS);
    res.header("Access-Control-Allow-Headers", ALLOWED_HEADERS);

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }

    next();
  };
}
