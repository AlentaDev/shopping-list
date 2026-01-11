/* eslint-disable sonarjs/no-hardcoded-passwords */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { login, register } from "./AuthService";

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

describe("AuthService", () => {
  const jsonHeaders = { "Content-Type": "application/json" };
  const samplePassword = "secret";
  const loginEmail = "ana@example.com";
  const registerEmail = "luis@example.com";
  const loginToken = "token-123";
  const registerToken = "token-456";
  const loginUserId = "user-1";
  const registerUserId = "user-2";

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("posts login payload to auth endpoint", async () => {
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          token: loginToken,
          user: {
            id: loginUserId,
            name: "Ana",
            email: loginEmail,
          },
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({ email: loginEmail, password: samplePassword })
    )
      .resolves.toEqual({
        token: loginToken,
        userId: loginUserId,
        userName: "Ana",
        email: loginEmail,
      });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        email: loginEmail,
        password: samplePassword,
      }),
    });
  });

  it("posts register payload to auth endpoint", async () => {
    const fetchMock = vi.fn<(input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>>(
      async () => ({
        ok: true,
        json: async () => ({
          token: registerToken,
          user: {
            id: registerUserId,
            name: "Luis",
            email: registerEmail,
          },
        }),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      register({
        name: "Luis",
        email: registerEmail,
        password: samplePassword,
      })
    ).resolves.toEqual({
      token: registerToken,
      userId: registerUserId,
      userName: "Luis",
      email: registerEmail,
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: jsonHeaders,
      body: JSON.stringify({
        name: "Luis",
        email: registerEmail,
        password: samplePassword,
      }),
    });
  });

  it("throws when login fails", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      login({ email: loginEmail, password: samplePassword })
    ).rejects.toThrow("Unable to login.");
  });

  it("throws when register fails", async () => {
    const fetchMock = vi.fn<(input: RequestInfo) => Promise<FetchResponse>>(
      async () => ({
        ok: false,
        json: async () => ({}),
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      register({
        name: "Luis",
        email: registerEmail,
        password: samplePassword,
      })
    ).rejects.toThrow("Unable to register.");
  });
});
