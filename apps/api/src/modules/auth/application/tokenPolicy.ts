export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function getAccessTokenExpiresAt(now: Date): Date {
  return new Date(now.getTime() + ACCESS_TOKEN_TTL_MS);
}

export function getRefreshTokenExpiresAt(now: Date): Date {
  return new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
}
