import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_401_RETRY_PRESETS, fetchWithAuth } from "./fetchWithAuth";

describe("fetchWithAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the original response when status is not 401", async () => {
    const response = new Response(null, { status: 200 });
    const fetchMock = vi.fn(async () => response);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", { method: "GET" });

    expect(result).toBe(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/lists", {
      method: "GET",
      credentials: "include",
    });
  });

  it("retries safe GET request once after refresh when 401 happens", async () => {
    const firstResponse = new Response(null, { status: 401 });
    const refreshResponse = new Response(null, { status: 200 });
    const retriedResponse = new Response(null, { status: 200 });
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(retriedResponse);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", { method: "GET" });

    expect(result).toBe(retriedResponse);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-idempotent request by default", async () => {
    const unauthorized = new Response(null, { status: 401 });
    const fetchMock = vi.fn(async () => unauthorized);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", {
      method: "POST",
      body: JSON.stringify({ name: "Weekly" }),
    });

    expect(result).toBe(unauthorized);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("supports explicit opt-in to retry non-idempotent request", async () => {
    const firstResponse = new Response(null, { status: 401 });
    const refreshResponse = new Response(null, { status: 200 });
    const retriedResponse = new Response(null, { status: 201 });
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(retriedResponse);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", {
      method: "POST",
      body: JSON.stringify({ name: "Weekly" }),
      retryOnAuth401: true,
    });

    expect(result).toBe(retriedResponse);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("returns original 401 response when refresh fails", async () => {
    const originalUnauthorized = new Response(null, { status: 401 });
    const failedRefresh = new Response(null, { status: 401 });
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(originalUnauthorized)
      .mockResolvedValueOnce(failedRefresh);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", { method: "GET" });

    expect(result).toBe(originalUnauthorized);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not recurse when calling refresh endpoint directly", async () => {
    const unauthorizedRefresh = new Response(null, { status: 401 });
    const fetchMock = vi.fn(async () => unauthorizedRefresh);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/auth/refresh", { method: "POST" });

    expect(result).toBe(unauthorizedRefresh);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
  });

  it("supports strict preset to disable retries for safe routes", async () => {
    const unauthorized = new Response(null, { status: 401 });
    const fetchMock = vi.fn(async () => unauthorized);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", {
      method: "GET",
      retryPolicyPreset: AUTH_401_RETRY_PRESETS.STRICT,
    });

    expect(result).toBe(unauthorized);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
