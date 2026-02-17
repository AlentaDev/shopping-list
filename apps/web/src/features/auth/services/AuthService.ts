import { getDeviceFingerprint } from "@src/shared/utils/deviceFingerprint";
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";
import {
  mapHttpErrorToDomainError,
  type HttpDomainError,
} from "@src/shared/services/http/httpErrorMapper";

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
  userVisible: boolean;

  constructor(code: string, userVisible = false) {
    super(code);
    this.code = code;
    this.userVisible = userVisible;
  }
}

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  try {
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
  } catch (error) {
    await throwMappedNetworkError(error, "register_request_failed");
  }
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  try {
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
  } catch (error) {
    await throwMappedNetworkError(error, "login_request_failed");
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  try {
    const response = await fetchWithAuth("/api/users/me");

    if (!response.ok) {
      await throwAuthErrorFromResponse(response, "Unable to load current user");
    }

    return (await response.json()) as AuthUser;
  } catch (error) {
    await throwMappedNetworkError(error, "current_user_request_failed");
  }
}

export async function refreshSession(): Promise<{ ok: boolean }> {
  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      await throwAuthErrorFromResponse(response, "Unable to refresh session");
    }

    return (await response.json()) as { ok: boolean };
  } catch (error) {
    await throwMappedNetworkError(error, "refresh_request_failed");
  }
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
  fallbackCode: string,
): Promise<never> {
  const domainError = await mapHttpErrorToDomainError({
    response,
    fallbackCode,
  });

  throw createAuthServiceError(domainError, fallbackCode);
}

async function throwMappedNetworkError(
  error: unknown,
  fallbackCode: string,
): Promise<never> {
  if (error instanceof AuthServiceError) {
    throw error;
  }

  const domainError = await mapHttpErrorToDomainError({
    error,
    fallbackCode,
  });

  throw createAuthServiceError(domainError, fallbackCode);
}

function createAuthServiceError(
  domainError: HttpDomainError,
  fallbackCode: string,
): AuthServiceError {
  return new AuthServiceError(domainError.code ?? fallbackCode, domainError.userVisible);
}
