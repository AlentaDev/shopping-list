import { Router, type Response } from "express";
import { LogoutTokens } from "../application/logoutTokens.js";
import { RegisterWithTokens } from "../application/registerWithTokens.js";
import { LoginWithTokens } from "../application/loginWithTokens.js";
import { RefreshAccessToken } from "../application/refreshAccessToken.js";
import { InvalidRefreshTokenError } from "../application/errors.js";
import { toPublicUser } from "@src/modules/users/public.js";
import { AppError } from "@src/shared/errors/appError.js";
import { loginSchema, signupSchema } from "./schemas.js";

const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

type AuthRouterDependencies = {
  logoutTokens: LogoutTokens;
  registerWithTokens: RegisterWithTokens;
  loginWithTokens: LoginWithTokens;
  refreshAccessToken: RefreshAccessToken;
};

export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const { fingerprint, ...input } = signupSchema.parse(req.body);
      const { user, tokens } = await deps.registerWithTokens.execute({
        ...input,
        device: {
          fingerprint,
          userAgent: req.get("user-agent") ?? null,
        },
      });

      setAuthCookies(res, tokens);

      res.status(201).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const { fingerprint, ...input } = loginSchema.parse(req.body);
      const { user, tokens } = await deps.loginWithTokens.execute({
        ...input,
        device: {
          fingerprint,
          userAgent: req.get("user-agent") ?? null,
        },
      });

      setAuthCookies(res, tokens);

      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", (_req, _res, next) => {
    next(new AppError(410, "deprecated_endpoint", "Use /api/users/me instead"));
  });

  router.post("/refresh", async (req, res, next) => {
    try {
      const refreshToken = getCookieFromRequest(
        req.headers.cookie,
        REFRESH_TOKEN_COOKIE_NAME,
      );
      if (!refreshToken) {
        throw new InvalidRefreshTokenError();
      }

      const { tokens } = await deps.refreshAccessToken.execute({
        refreshToken,
      });

      setAuthCookies(res, tokens);

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      const refreshToken = getCookieFromRequest(
        req.headers.cookie,
        REFRESH_TOKEN_COOKIE_NAME,
      );
      await deps.logoutTokens.execute(refreshToken);

      clearAuthCookies(res);

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function setAuthCookies(
  res: Response,
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresAt: Date;
    refreshTokenExpiresAt: Date;
  },
) {
  res.cookie("access_token", tokens.accessToken, {
    ...COOKIE_OPTIONS,
    expires: tokens.accessTokenExpiresAt,
  });
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    expires: tokens.refreshTokenExpiresAt,
  });
}

function clearAuthCookies(res: Response) {
  res.cookie("access_token", "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, "", {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });
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
