import { Response, Router } from "express";
import { SignupUser } from "../application/signup";
import { LoginUser } from "../application/login";
import { GetCurrentUser } from "../application/me";
import { LogoutUser } from "../application/logout";
import { NotAuthenticatedError } from "../application/errors";
import { toPublicUser } from "../domain/user";
import { loginSchema, registerSchema } from "./schemas";
import type { SessionStore } from "../../../shared/auth/sessionStore";

const ACCESS_TOKEN_COOKIE_NAME = "accessToken";
const REFRESH_TOKEN_COOKIE_NAME = "refreshToken";
const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type AuthRouterDependencies = {
  signupUser: SignupUser;
  loginUser: LoginUser;
  getCurrentUser: GetCurrentUser;
  logoutUser: LogoutUser;
  sessionStore: SessionStore;
};

export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const router = Router();

  router.post("/register", async (req, res, next) => {
    try {
      const input = registerSchema.parse(req.body);
      const user = await deps.signupUser.execute(input);
      const sessionId = await deps.sessionStore.createSession(user.id);

      setAccessTokenCookie(res, sessionId);
      setRefreshTokenCookie(res, sessionId);
      res.status(201).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, sessionId } = await deps.loginUser.execute(input);

      setAccessTokenCookie(res, sessionId);
      setRefreshTokenCookie(res, sessionId);
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
        throw new NotAuthenticatedError();
      }

      const userId = await deps.sessionStore.getUserId(refreshToken);
      if (!userId) {
        throw new NotAuthenticatedError();
      }

      setAccessTokenCookie(res, refreshToken);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.get("/me", async (req, res, next) => {
    try {
      const sessionId = getCookieFromRequest(
        req.headers.cookie,
        ACCESS_TOKEN_COOKIE_NAME
      );
      const user = await deps.getCurrentUser.execute(sessionId);

      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      const sessionId =
        getCookieFromRequest(req.headers.cookie, REFRESH_TOKEN_COOKIE_NAME) ??
        getCookieFromRequest(req.headers.cookie, ACCESS_TOKEN_COOKIE_NAME);
      await deps.logoutUser.execute(sessionId);

      clearAuthCookies(res);

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
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

function setAccessTokenCookie(res: Response, token: string) {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_MAX_AGE_MS,
  });
}

function setRefreshTokenCookie(res: Response, token: string) {
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
  });
}

function clearAuthCookies(res: Response) {
  res.cookie(ACCESS_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
  res.cookie(REFRESH_TOKEN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 0,
  });
}
