import type { AuthUser } from "../AuthService";

type AuthUserPayload = {
  id?: string;
  name?: string;
  email?: string;
  postalCode?: string;
};

type OkPayload = {
  ok?: boolean;
};

export const adaptAuthUserResponse = (payload: unknown): AuthUser => {
  const data = payload as AuthUserPayload;

  return {
    id: data.id ?? "",
    name: data.name ?? "",
    email: data.email ?? "",
    postalCode: data.postalCode ?? "",
  };
};

export const adaptOkResponse = (payload: unknown): { ok: boolean } => {
  const data = payload as OkPayload;

  return {
    ok: data.ok ?? false,
  };
};
