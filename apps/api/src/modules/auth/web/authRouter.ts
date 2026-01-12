import { Router, type Response } from "express";
import { SignupUser } from "../application/signup";
import { LoginUser } from "../application/login";
import { GetCurrentUser } from "../application/me";
import { LogoutUser } from "../application/logout";
import { RegisterWithTokens } from "../application/registerWithTokens";
import { LoginWithTokens } from "../application/loginWithTokens";
import { RefreshAccessToken } from "../application/refreshAccessToken";
import { InvalidRefreshTokenError } from "../application/errors";
import { toPublicUser } from "../domain/user";
import { loginSchema, signupSchema } from "./schemas";

const SESSION_COOKIE_NAME = "session";
const ACCESS_TOKEN_COOKIE_NAME = "access_token";
const REFRESH_TOKEN_COOKIE_NAME = "refresh_token";

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

type AuthRouterDependencies = {
  signupUser: SignupUser;
  loginUser: LoginUser;
  getCurrentUser: GetCurrentUser;
  logoutUser: LogoutUser;
  registerWithTokens: RegisterWithTokens;
  loginWithTokens: LoginWithTokens;
  refreshAccessToken: RefreshAccessToken;
};

export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const router = Router();

  router.post("/signup", async (req, res, next) => {
    try {
      const input = signupSchema.parse(req.body);
      const user = await deps.signupUser.execute(input);

      res.status(201).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

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

  router.post("/login-session", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, sessionId } = await deps.loginUser.execute(input);

      res.cookie(SESSION_COOKIE_NAME, sessionId, COOKIE_OPTIONS);

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
      const sessionId = getSessionIdFromRequest(req.headers.cookie);
      const user = await deps.getCurrentUser.execute(sessionId);

      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout", async (req, res, next) => {
    try {
      const sessionId = getSessionIdFromRequest(req.headers.cookie);
      await deps.logoutUser.execute(sessionId);

      res.cookie(SESSION_COOKIE_NAME, "", {
        ...COOKIE_OPTIONS,
        maxAge: 0,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  router.post("/logout-token", async (_req, res) => {
    clearAuthCookies(res);

    res.status(200).json({ ok: true });
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

function getSessionIdFromRequest(cookieHeader: string | undefined): string | null {
  return getCookieFromRequest(cookieHeader, SESSION_COOKIE_NAME);
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
