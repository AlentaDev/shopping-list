import type { Request, RequestHandler } from "express";
import { AppError } from "../errors/appError";
import type { SessionStore } from "../auth/sessionStore";

const ACCESS_TOKEN_COOKIE_NAME = "accessToken";

export type AuthenticatedRequest = Request & { userId: string };

export function requireAuth(sessionStore: SessionStore): RequestHandler {
  return async (req, _res, next) => {
    try {
      const sessionId = getCookieFromRequest(
        req.headers.cookie,
        ACCESS_TOKEN_COOKIE_NAME
      );
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

function getCookieFromRequest(
  cookieHeader: string | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [name, ...rest] = cookie.split("=");
    if (name === cookieName) {
      return rest.join("=") || null;
    }
  }

  return null;
}
