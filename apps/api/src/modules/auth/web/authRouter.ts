import { Router } from "express";
import { SignupUser } from "../application/signup";
import { LoginUser } from "../application/login";
import { GetCurrentUser } from "../application/me";
import { LogoutUser } from "../application/logout";
import { toPublicUser } from "../domain/user";
import { loginSchema, signupSchema } from "./schemas";

const SESSION_COOKIE_NAME = "session";

type AuthRouterDependencies = {
  signupUser: SignupUser;
  loginUser: LoginUser;
  getCurrentUser: GetCurrentUser;
  logoutUser: LogoutUser;
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

  router.post("/login", async (req, res, next) => {
    try {
      const input = loginSchema.parse(req.body);
      const { user, sessionId } = await deps.loginUser.execute(input);

      res.cookie(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        sameSite: "lax",
      });

      res.status(200).json(toPublicUser(user));
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
        httpOnly: true,
        sameSite: "lax",
        maxAge: 0,
      });

      res.status(200).json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
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
