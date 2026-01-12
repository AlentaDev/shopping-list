import { Router, type Response } from "express";
import { GetCurrentUser } from "../application/me";
import { LogoutTokens } from "../application/logoutTokens";
import { RegisterWithTokens } from "../application/registerWithTokens";
import { LoginWithTokens } from "../application/loginWithTokens";
import { RefreshAccessToken } from "../application/refreshAccessToken";
import { InvalidRefreshTokenError } from "../application/errors";
import { toPublicUser } from "../domain/user";
import { verifyJwt } from "../../../shared/security/jwt";
import { loginSchema, signupSchema } from "./schemas";

const ACCESS_TOKEN_COOKIE_NAME = "access_token";
const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET ?? "dev-access-token-secret";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

type AuthRouterDependencies = {
  getCurrentUser: GetCurrentUser;
  logoutTokens: LogoutTokens;
  registerWithTokens: RegisterWithTokens;
  loginWithTokens: LoginWithTokens;
  refreshAccessToken: RefreshAccessToken;
};

export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const input = signupSchema.parse(req.body);
      const { user, tokens } = await deps.registerWithTokens.execute(input);

      setAuthCookies(res, tokens);

      res.status(201).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, tokens } = await deps.loginWithTokens.execute(input);

      setAuthCookies(res, tokens);

      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/refresh", async (req, res, next) => {
    try {
      const refreshToken = getCookieFromRequest(
        req.headers.cookie,
        REFRESH_TOKEN_COOKIE_NAME
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

  router.get("/me", async (req, res, next) => {
    try {
      const accessToken = getCookieFromRequest(
        req.headers.cookie,
        ACCESS_TOKEN_COOKIE_NAME
      );
      const userId = getUserIdFromAccessToken(accessToken);
      const user = await deps.getCurrentUser.execute(userId);

      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      const refreshToken = getCookieFromRequest(
        req.headers.cookie,
        REFRESH_TOKEN_COOKIE_NAME
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
  }
) {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, tokens.accessToken, {
    ...COOKIE_OPTIONS,
    expires: tokens.accessTokenExpiresAt,
  });
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    expires: tokens.refreshTokenExpiresAt,
  });
}

function clearAuthCookies(res: Response) {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, "", {
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
  name: string
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

function getUserIdFromAccessToken(accessToken: string | null): string | null {
  if (!accessToken) {
    return null;
  }

  const payload = verifyJwt(accessToken, ACCESS_TOKEN_SECRET);
  if (!payload) {
    return null;
  }

  if (payload.exp * 1000 <= Date.now()) {
    return null;
  }

  return payload.sub;
}
