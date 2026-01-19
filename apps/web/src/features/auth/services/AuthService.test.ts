import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  logoutUser,
} from "./AuthService";

const FINGERPRINT = "test-device-fingerprint";

vi.mock("@src/shared/utils/deviceFingerprint", () => ({
  getDeviceFingerprint: vi.fn(() => FINGERPRINT),
}));

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

    vi.stubGlobal("fetch", fetchMock);

    await expect(registerUser(REGISTER_INPUT)).resolves.toEqual(
      RESPONSE_PAYLOAD,
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
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

    vi.stubGlobal("fetch", fetchMock);

    await expect(loginUser(LOGIN_INPUT)).resolves.toEqual(RESPONSE_PAYLOAD);

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/login", {
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

    vi.stubGlobal("fetch", fetchMock);

    await expect(registerUser(REGISTER_INPUT)).rejects.toThrow(
      "Unable to register",
    );
  });

  it("throws when login request fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(loginUser(LOGIN_INPUT)).rejects.toThrow("Unable to login");
  });

  it("logs out a user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => ({ ok: true }),
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutUser()).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
    });
  });

  it("loads the current user", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: true,
      json: async () => RESPONSE_PAYLOAD,
    }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getCurrentUser()).resolves.toEqual(RESPONSE_PAYLOAD);

    expect(fetchMock).toHaveBeenCalledWith("/api/users/me");
  });

  it("throws when loading the current user fails", async () => {
    const fetchMock = vi.fn<
      (input: RequestInfo, init?: RequestInit) => Promise<FetchResponse>
    >(async () => ({
      ok: false,
      json: async () => ({}),
    }));

    vi.stubGlobal("fetch", fetchMock);

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

    vi.stubGlobal("fetch", fetchMock);

    await expect(logoutUser()).rejects.toThrow("Unable to logout");
  });
});
