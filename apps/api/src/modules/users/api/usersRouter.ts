import { Router } from "express";
import type { RequestHandler } from "express";
import type { AuthenticatedRequest } from "@src/shared/web/requireAuth.js";
import { AppError } from "@src/shared/errors/appError.js";
import { API_ERROR_MESSAGES } from "@src/shared/constants/apiErrorMessages.js";
import { GetCurrentUser } from "../application/getCurrentUser.js";
import { toPublicUser } from "../domain/user.js";

type UsersRouterDependencies = {
  requireAuth: RequestHandler;
  getCurrentUser: GetCurrentUser;
};

export function createUsersRouter(deps: UsersRouterDependencies): Router {
  const router = Router();

  router.use(deps.requireAuth);

  router.get("/me", async (req, res, next) => {
    try {
      const userId = getUserId(req as AuthenticatedRequest);
      const user = await deps.getCurrentUser.execute(userId);

      res.status(200).json(toPublicUser(user));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function getUserId(req: AuthenticatedRequest): string {
  if (!req.userId) {
    throw new AppError(
      401,
      "not_authenticated",
      API_ERROR_MESSAGES.notAuthenticated
    );
  }

  return req.userId;
}
