import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "@src/shared/errors/appError.js";

export function errorMiddleware(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "validation_error", details: error.issues });
    return;
  }

  if (error instanceof AppError) {
    res
      .status(error.status)
      .json({ error: error.code, ...(error.details ?? {}) });
    return;
  }

  res.status(500).json({ error: "internal_server_error" });
}
