const AUTH_REFRESH_ENDPOINT = "/api/auth/refresh";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const AUTH_401_RETRY_PRESET_VALUES = {
  SAFE: "safe",
  STRICT: "strict",
} as const;

export const AUTH_401_RETRY_PRESETS = AUTH_401_RETRY_PRESET_VALUES;

export type Auth401RetryPolicyPreset =
  (typeof AUTH_401_RETRY_PRESET_VALUES)[keyof typeof AUTH_401_RETRY_PRESET_VALUES];

export type Auth401RetryPolicyOptions = {
  method?: string;
  retryOnAuth401?: boolean;
  retryPolicyPreset?: Auth401RetryPolicyPreset;
};

const normalizeMethod = (method?: string): string =>
  (method ?? "GET").toUpperCase();

const normalizePathname = (requestUrl: string): string => {
  if (requestUrl.startsWith("http://") || requestUrl.startsWith("https://")) {
    return new URL(requestUrl).pathname;
  }

  return requestUrl;
};

const isSafeListsReadRoute = (pathname: string): boolean =>
  pathname === "/api/lists" ||
  pathname.startsWith("/api/lists/") ||
  pathname === "/api/lists/autosave";

const isSafeUsersReadRoute = (pathname: string): boolean => pathname === "/api/users/me";

const isSafeRetryRoute = (pathname: string): boolean =>
  isSafeListsReadRoute(pathname) || isSafeUsersReadRoute(pathname);

const isSafeByBackendBehavior = (requestUrl: string, method?: string): boolean => {
  const normalizedMethod = normalizeMethod(method);

  if (!SAFE_METHODS.has(normalizedMethod)) {
    return false;
  }

  const pathname = normalizePathname(requestUrl);

  /**
   * Rationale:
   * - `/api/lists/*` GET routes currently read state only and do not mutate backend data.
   * - `/api/users/me` GET only resolves authenticated user profile.
   *
   * High-risk examples intentionally excluded from default retry:
   * - POST `/api/lists` may create duplicates.
   * - PATCH `/api/lists/:listId/items/:itemId` may toggle item state twice.
   * - DELETE `/api/lists/:listId` removes data.
   */
  return isSafeRetryRoute(pathname);
};

export const shouldRetryOnAuth401 = (
  requestUrl: string,
  options: Auth401RetryPolicyOptions = {}
): boolean => {
  if (typeof options.retryOnAuth401 === "boolean") {
    return options.retryOnAuth401;
  }

  const preset = options.retryPolicyPreset ?? AUTH_401_RETRY_PRESETS.SAFE;

  if (preset === AUTH_401_RETRY_PRESETS.STRICT) {
    return false;
  }

  const pathname = normalizePathname(requestUrl);

  if (pathname === AUTH_REFRESH_ENDPOINT) {
    return false;
  }

  return isSafeByBackendBehavior(pathname, options.method);
};
