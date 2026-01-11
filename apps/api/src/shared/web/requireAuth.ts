import type { Request, RequestHandler } from "express";
import { AppError } from "../errors/appError";
import type { SessionStore } from "../auth/sessionStore";

const SESSION_COOKIE_NAME = "session";

export type AuthenticatedRequest = Request & { userId: string };

export function requireAuth(sessionStore: SessionStore): RequestHandler {
  return async (req, _res, next) => {
    try {
      const sessionId = getSessionIdFromRequest(req.headers.cookie);
      if (!sessionId) {
        throw new AppError(401, "not_authenticated", "Not authenticated");
      }

      const userId = await sessionStore.getUserId(sessionId);
      if (!userId) {
        throw new AppError(401, "not_authenticated", "Not authenticated");
      }

      (req as AuthenticatedRequest).userId = userId;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function getSessionIdFromRequest(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === SESSION_COOKIE_NAME) {
      return rest.join("=") || null;
    }
  }

  return null;
}
