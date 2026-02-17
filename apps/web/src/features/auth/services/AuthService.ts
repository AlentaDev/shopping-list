import { getDeviceFingerprint } from "@src/shared/utils/deviceFingerprint";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  postalCode: string;
};

export class AuthServiceError extends Error {
  code: string;

  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const response = await fetchWithAuth("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      fingerprint: getDeviceFingerprint(),
    }),
  });

  if (!response.ok) {
    await throwAuthErrorFromResponse(response, "Unable to register");
  }

  return (await response.json()) as AuthUser;
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  const response = await fetchWithAuth("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      fingerprint: getDeviceFingerprint(),
    }),
  });

  if (!response.ok) {
    await throwAuthErrorFromResponse(response, "Unable to login");
  }

  return (await response.json()) as AuthUser;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetchWithAuth("/api/users/me");

  if (!response.ok) {
    throw new Error("Unable to load current user");
  }

  return (await response.json()) as AuthUser;
}

export async function refreshSession(): Promise<{ ok: boolean }> {
  const response = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    await throwAuthErrorFromResponse(response, "Unable to refresh session");
  }

  return (await response.json()) as { ok: boolean };
}

export async function logoutUser(): Promise<{ ok: boolean }> {
  const response = await fetchWithAuth("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to logout");
  }

  return (await response.json()) as { ok: boolean };
}

async function throwAuthErrorFromResponse(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const errorCode = await readErrorCode(response);
  if (errorCode) {
    throw new AuthServiceError(errorCode);
  }

  throw new Error(fallbackMessage);
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (data && typeof data === "object" && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    return null;
  }

  return null;
}
