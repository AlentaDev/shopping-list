import type { Request, Response } from "express";
import { z } from "zod";
import { describe, expect, it, vi } from "vitest";
import { API_ERROR_MESSAGES } from "@src/shared/constants/apiErrorMessages.js";
import { AppError } from "@src/shared/errors/appError.js";
import { errorMiddleware } from "./errorMiddleware.js";

describe("errorMiddleware", () => {
  it("returns 400 with validation details for ZodError", () => {
    const schema = z.object({ name: z.string() });
    const result = schema.safeParse({});

    if (result.success) {
      throw new Error("Expected validation to fail");
    }

    const { res, json, status } = createMockResponse();
    const next = vi.fn();

    errorMiddleware(result.error, {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: "validation_error",
      details: result.error.issues,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns AppError status and code", () => {
    const { res, json, status } = createMockResponse();
    const next = vi.fn();

    errorMiddleware(
      new AppError(
        401,
        "not_authenticated",
        API_ERROR_MESSAGES.notAuthenticated,
      ),
      {} as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({ error: "not_authenticated" });
    expect(next).not.toHaveBeenCalled();
  });

  it("includes AppError details in response payload", () => {
    const { res, json, status } = createMockResponse();
    const next = vi.fn();

    errorMiddleware(
      new AppError(409, "autosave_version_conflict", "Conflict", {
        remoteUpdatedAt: "2024-01-01T11:10:00.000Z",
      }),
      {} as Request,
      res,
      next,
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      error: "autosave_version_conflict",
      remoteUpdatedAt: "2024-01-01T11:10:00.000Z",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 500 for unknown errors", () => {
    const { res, json, status } = createMockResponse();
    const next = vi.fn();

    errorMiddleware(new Error("boom"), {} as Request, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ error: "internal_server_error" });
    expect(next).not.toHaveBeenCalled();
  });
});

function createMockResponse() {
  const status = vi.fn();
  const json = vi.fn();
  const res = {
    status: status.mockReturnThis(),
    json,
  } as unknown as Response;

  return { res, status, json };
}
