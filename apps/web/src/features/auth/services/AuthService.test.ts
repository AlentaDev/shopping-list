import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
import {
  AuthServiceError,
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
  refreshSession,
} from "./AuthService";

const FINGERPRINT = "test-device-fingerprint";

vi.mock("@src/shared/utils/deviceFingerprint", () => ({
  getDeviceFingerprint: vi.fn(() => FINGERPRINT),
}));

vi.mock("@src/shared/services/http/fetchWithAuth", () => ({
  fetchWithAuth: vi.fn(),
}));

const fetchWithAuthMock = vi.mocked(fetchWithAuth);

type FetchResponse = {
  ok: boolean;
  json: () => Promise<unknown>;
};

const TEST_EMAIL = "ada@example.com";
const TEST_PASSWORD = "Password12!A";
const REGISTER_INPUT = {
  name: "Ada",
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
  postalCode: "28001",
};
const LOGIN_INPUT = {
  email: TEST_EMAIL,
  password: TEST_PASSWORD,
};
const RESPONSE_PAYLOAD = {
  id: "user-1",
  name: "Ada",
  email: TEST_EMAIL,
  postalCode: "28001",
};

describe("AuthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("registers a new user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => RESPONSE_PAYLOAD,
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(registerUser(REGISTER_INPUT)).resolves.toEqual(
      RESPONSE_PAYLOAD,
    );

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...REGISTER_INPUT, fingerprint: FINGERPRINT }),
    });
  });

  it("logs in a user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => RESPONSE_PAYLOAD,
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(loginUser(LOGIN_INPUT)).resolves.toEqual(RESPONSE_PAYLOAD);

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...LOGIN_INPUT, fingerprint: FINGERPRINT }),
    });
  });

  it("throws when register request fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(registerUser(REGISTER_INPUT)).rejects.toThrow(
      "Unable to register",
    );
  });

  it("throws a typed error when register response includes an error code", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({ error: "duplicate_email" }),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(registerUser(REGISTER_INPUT)).rejects.toBeInstanceOf(
      AuthServiceError,
    );
    await expect(registerUser(REGISTER_INPUT)).rejects.toMatchObject({
      code: "duplicate_email",
    });
  });

  it("throws when login request fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(loginUser(LOGIN_INPUT)).rejects.toThrow("Unable to login");
  });


  it("normaliza errores de red como AuthServiceError visible", async () => {
    const fetchMock = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(loginUser(LOGIN_INPUT)).rejects.toMatchObject({
      code: "network_error",
      userVisible: true,
    });
  });

  it("logs out a user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(logoutUser()).resolves.toEqual({ ok: true });

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });

  it("refreshes the user session", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });
    expect(fetchWithAuthMock).not.toHaveBeenCalledWith("/api/auth/refresh", expect.anything());
  });

  it("loads the current user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => RESPONSE_PAYLOAD,
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getCurrentUser()).resolves.toEqual(RESPONSE_PAYLOAD);

    expect(fetchWithAuthMock).toHaveBeenCalledWith("/api/users/me");
  });


  it("throws typed error when current user responds with auth error code", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({ error: "not_authenticated" }),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getCurrentUser()).rejects.toBeInstanceOf(AuthServiceError);
    await expect(getCurrentUser()).rejects.toMatchObject({
      code: "not_authenticated",
    });
  });

  it("throws when loading the current user fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(getCurrentUser()).rejects.toThrow(
      "Unable to load current user",
    );
  });

  it("throws when logout request fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({ ok: false }),
    }));

    fetchWithAuthMock.mockImplementation(fetchMock as typeof fetchWithAuth);

    await expect(logoutUser()).rejects.toThrow("Unable to logout");
  });

  it("throws a typed error when refresh session fails with an error code", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({ error: "not_authenticated" }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(refreshSession()).rejects.toBeInstanceOf(AuthServiceError);
    await expect(refreshSession()).rejects.toMatchObject({
      code: "not_authenticated",
    });
  });
});
