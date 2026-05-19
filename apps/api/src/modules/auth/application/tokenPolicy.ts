export const ACCESS_TOKEN_TTL_DEV_MS = 60 * 1000;
export const ACCESS_TOKEN_TTL_PROD_MS = 15 * 60 * 1000;

export function getAccessTokenTtlMs(runtimeEnv = process.env.NODE_ENV): number {
  return runtimeEnv === "production"
    ? ACCESS_TOKEN_TTL_PROD_MS
    : ACCESS_TOKEN_TTL_DEV_MS;
}

export const ACCESS_TOKEN_TTL_MS = getAccessTokenTtlMs();
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getAccessTokenExpiresAt(now: Date): Date {
  return new Date(now.getTime() + ACCESS_TOKEN_TTL_MS);
}

export function getRefreshTokenExpiresAt(now: Date): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
}
