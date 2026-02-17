import { beforeEach, describe, expect, it, vi } from "vitest";
import { AUTH_401_RETRY_PRESETS, fetchWithAuth } from "./fetchWithAuth";

describe("fetchWithAuth", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
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



  it("does not emit expected refresh logs in quiet mode", async () => {
    const firstResponse = new Response(null, { status: 401 });
    const refreshResponse = new Response(null, { status: 200 });
    const retriedResponse = new Response(null, { status: 200 });
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(retriedResponse);

    vi.stubGlobal("fetch", fetchMock);

    await fetchWithAuth("/api/users/me", { method: "GET", authLogMode: "quiet" });

    expect(console.info).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
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

  it("coordinates a single refresh request for concurrent 401 responses", async () => {
    const requestAttempts = new Map<string, number>();

    let resolveRefresh: (response: Response) => void;
    const refreshPromise = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;

      if (requestUrl === "/api/auth/refresh") {
        return refreshPromise;
      }

      const attempt = (requestAttempts.get(requestUrl) ?? 0) + 1;
      requestAttempts.set(requestUrl, attempt);

      if (attempt === 1) {
        return new Response(null, { status: 401 });
      }

      return new Response(null, { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const pendingRequests = [
      fetchWithAuth("/api/lists/1", { method: "GET" }),
      fetchWithAuth("/api/lists/2", { method: "GET" }),
      fetchWithAuth("/api/lists/3", { method: "GET" }),
    ];

    await Promise.resolve();

    expect(fetchMock.mock.calls).toHaveLength(4);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")
    ).toHaveLength(1);

    resolveRefresh!(new Response(null, { status: 200 }));

    const responses = await Promise.all(pendingRequests);

    expect(responses.map((response) => response.status)).toEqual([200, 200, 200]);
    expect(
      fetchMock.mock.calls.filter(([url]) => url === "/api/auth/refresh")
    ).toHaveLength(1);
    expect(requestAttempts.get("/api/lists/1")).toBe(2);
    expect(requestAttempts.get("/api/lists/2")).toBe(2);
    expect(requestAttempts.get("/api/lists/3")).toBe(2);
  });

  it("fails concurrent pending requests consistently and resets lock after rejected refresh", async () => {
    const requestAttempts = new Map<string, number>();
    let refreshCallCount = 0;

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;

      if (requestUrl === "/api/auth/refresh") {
        refreshCallCount += 1;

        if (refreshCallCount === 1) {
          throw new Error("network");
        }

        return new Response(null, { status: 200 });
      }

      const attempt = (requestAttempts.get(requestUrl) ?? 0) + 1;
      requestAttempts.set(requestUrl, attempt);

      if (attempt === 1) {
        return new Response(null, { status: 401 });
      }

      return new Response(null, { status: 200 });
    });

    vi.stubGlobal("fetch", fetchMock);

    const failedBatch = await Promise.all([
      fetchWithAuth("/api/lists/a", { method: "GET" }),
      fetchWithAuth("/api/lists/b", { method: "GET" }),
      fetchWithAuth("/api/lists/c", { method: "GET" }),
    ]);

    expect(failedBatch.map((response) => response.status)).toEqual([401, 401, 401]);
    expect(refreshCallCount).toBe(1);

    const recovered = await fetchWithAuth("/api/lists/d", { method: "GET" });

    expect(recovered.status).toBe(200);
    expect(refreshCallCount).toBe(2);
  });
});
