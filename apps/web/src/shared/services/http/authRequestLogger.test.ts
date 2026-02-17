import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAuthRequestLogger,
  resolveAuthLogMode,
  type AuthLogMode,
} from "./authRequestLogger";

describe("authRequestLogger", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const buildLogger = (mode: AuthLogMode) => createAuthRequestLogger(mode);

  it("logs expected auth refresh events in verbose mode", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = buildLogger("verbose");

    logger.logExpectedAuthRefreshEvent("received_401", {
      requestUrl: "/api/lists",
      method: "GET",
      status: 401,
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy).toHaveBeenCalledWith(
      "[AUTH_HTTP]",
      expect.objectContaining({
        category: "expected_auth_refresh",
        event: "received_401",
      })
    );
  });

  it("suppresses expected auth refresh events in quiet mode", () => {
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = buildLogger("quiet");

    logger.logExpectedAuthRefreshEvent("received_401", {
      requestUrl: "/api/lists",
      method: "GET",
      status: 401,
    });

    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("always logs unexpected auth failures", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logger = buildLogger("quiet");

    logger.logUnexpectedAuthFailure("refresh_failed", {
      requestUrl: "/api/lists",
      refreshStatus: 401,
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "[AUTH_HTTP]",
      expect.objectContaining({
        category: "unexpected_auth_failure",
        event: "refresh_failed",
      })
    );
  });

  it("always logs business validation errors", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logger = buildLogger("quiet");

    logger.logBusinessValidationError("request_failed", {
      requestUrl: "/api/lists",
      status: 422,
    });

    expect(warnSpy).toHaveBeenCalledWith(
      "[AUTH_HTTP]",
      expect.objectContaining({
        category: "business_validation_error",
        event: "request_failed",
      })
    );
  });

  it("resolves invalid mode values to quiet", () => {
    expect(resolveAuthLogMode("verbose")).toBe("verbose");
    expect(resolveAuthLogMode("quiet")).toBe("quiet");
    expect(resolveAuthLogMode("invalid")).toBe("quiet");
    expect(resolveAuthLogMode(undefined)).toBe("quiet");
  });
});
