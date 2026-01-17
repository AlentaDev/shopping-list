import type { Request, RequestHandler } from "express";
import { AppError } from "@src/shared/errors/appError.js";
import { API_ERROR_MESSAGES } from "@src/shared/constants/apiErrorMessages.js";
import { verifyJwt } from "@src/shared/security/jwt.js";

const ACCESS_TOKEN_COOKIE_NAME = "access_token";
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "dev-access-token-secret";

export type AuthenticatedRequest = Request & { userId: string };

export function requireAuth(): RequestHandler {
  return async (req, _res, next) => {
    try {
      const accessToken = getCookieFromRequest(
        req.headers.cookie,
        ACCESS_TOKEN_COOKIE_NAME,
      );
      if (!accessToken) {
        throw new AppError(
          401,
          "not_authenticated",
          API_ERROR_MESSAGES.notAuthenticated,
        );
      }

      const payload = verifyJwt(accessToken, ACCESS_TOKEN_SECRET);
      if (!payload) {
        throw new AppError(
          401,
          "not_authenticated",
          API_ERROR_MESSAGES.notAuthenticated,
        );
      }

      if (payload.exp * 1000 <= Date.now()) {
        throw new AppError(
          401,
          "not_authenticated",
          API_ERROR_MESSAGES.notAuthenticated,
        );
      }

      (req as AuthenticatedRequest).userId = payload.sub;
      next();
    } catch (error) {
      next(error);
    }
  };
}

function getCookieFromRequest(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  for (const cookie of cookies) {
    const [cookieName, ...rest] = cookie.split("=");
    if (cookieName === name) {
      return rest.join("=") || null;
    }
  }

  return null;
}
