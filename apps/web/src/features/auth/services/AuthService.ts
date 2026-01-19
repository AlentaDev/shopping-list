import { getDeviceFingerprint } from "@src/shared/utils/deviceFingerprint";

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

export async function registerUser(input: RegisterInput): Promise<AuthUser> {
  const response = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      fingerprint: getDeviceFingerprint(),
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to register");
  }

  return (await response.json()) as AuthUser;
}

export async function loginUser(input: LoginInput): Promise<AuthUser> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      fingerprint: getDeviceFingerprint(),
    }),
  });

  if (!response.ok) {
    throw new Error("Unable to login");
  }

  return (await response.json()) as AuthUser;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await fetch("/api/users/me");

  if (!response.ok) {
    throw new Error("Unable to load current user");
  }

  return (await response.json()) as AuthUser;
}

export async function logoutUser(): Promise<{ ok: boolean }> {
  const response = await fetch("/api/auth/logout", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error("Unable to logout");
  }

  return (await response.json()) as { ok: boolean };
}
