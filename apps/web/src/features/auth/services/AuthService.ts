import { toAuthSession } from "./adapters/AuthAdapter";
import type { AuthResponseDto, AuthSession } from "./adapters/AuthAdapter";

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

const requestAuth = async (
  url: string,
  payload: LoginPayload | RegisterPayload,
  errorMessage: string
): Promise<AuthSession> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(errorMessage);
  }

  const data = (await response.json()) as AuthResponseDto;
  return toAuthSession(data);
};

const login = (payload: LoginPayload) =>
  requestAuth("/api/auth/login", payload, "Unable to login.");

const register = (payload: RegisterPayload) =>
  requestAuth("/api/auth/register", payload, "Unable to register.");

export type { LoginPayload, RegisterPayload };
export { login, register };
