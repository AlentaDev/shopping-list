import {
  AUTH_401_RETRY_PRESETS,
  type Auth401RetryPolicyOptions,
  shouldRetryOnAuth401,
} from "./retryAuthPolicy";

const AUTH_REFRESH_ENDPOINT = "/api/auth/refresh";

type FetchWithAuthOptions = RequestInit & Auth401RetryPolicyOptions;

type InternalOptions = {
  isRefreshRequest: boolean;
};

const resolveRequestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.pathname;
  }

  return input.url;
};

const withAuthCredentials = (init: RequestInit = {}): RequestInit => ({
  ...init,
  credentials: "include",
});

const executeRequest = (input: RequestInfo | URL, init?: RequestInit) =>
  fetch(input, withAuthCredentials(init));

const shouldRetryRequestOn401 = (
  requestUrl: string,
  init: FetchWithAuthOptions,
  options: InternalOptions
): boolean => {
  if (options.isRefreshRequest || requestUrl === AUTH_REFRESH_ENDPOINT) {
    return false;
  }

  return shouldRetryOnAuth401(requestUrl, {
    method: init.method,
    retryOnAuth401: init.retryOnAuth401,
    retryPolicyPreset: init.retryPolicyPreset,
  });
};

const fetchWithAuthInternal = async (
  input: RequestInfo | URL,
  init: FetchWithAuthOptions = {},
  options: InternalOptions = { isRefreshRequest: false }
): Promise<Response> => {
  const response = await executeRequest(input, init);

  if (response.status !== 401) {
    return response;
  }

  const requestUrl = resolveRequestUrl(input);

  if (!shouldRetryRequestOn401(requestUrl, init, options)) {
    return response;
  }

  const refreshResponse = await fetchWithAuthInternal(
    AUTH_REFRESH_ENDPOINT,
    { method: "POST", retryPolicyPreset: AUTH_401_RETRY_PRESETS.STRICT },
    { isRefreshRequest: true }
  );

  if (!refreshResponse.ok) {
    return response;
  }

  return executeRequest(input, init);
};

export const fetchWithAuth = (
  input: RequestInfo | URL,
  init: FetchWithAuthOptions = {}
) => fetchWithAuthInternal(input, init);

export { AUTH_401_RETRY_PRESETS };
export type { FetchWithAuthOptions };
