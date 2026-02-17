import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth } from "./fetchWithAuth";

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

  it("refreshes session once and retries original request once after a 401", async () => {
    const signal = new AbortController().signal;
    const headers = new Headers({ "Content-Type": "application/json" });
    const firstResponse = new Response(null, { status: 401 });
    const refreshResponse = new Response(null, { status: 200 });
    const retriedResponse = new Response(null, { status: 200 });
    const body = JSON.stringify({ id: "list-1" });
    const fetchMock = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(refreshResponse)
      .mockResolvedValueOnce(retriedResponse);

    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchWithAuth("/api/lists", {
      method: "POST",
      headers,
      body,
      signal,
    });

    expect(result).toBe(retriedResponse);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/lists", {
      method: "POST",
      headers,
      body,
      signal,
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "/api/lists", {
      method: "POST",
      headers,
      body,
      signal,
      credentials: "include",
    });
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
});
