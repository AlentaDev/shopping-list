const AUTH_REFRESH_ENDPOINT = "/api/auth/refresh";

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

const fetchWithAuthInternal = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: InternalOptions = { isRefreshRequest: false }
): Promise<Response> => {
  const response = await executeRequest(input, init);

  if (response.status !== 401) {
    return response;
  }

  const requestUrl = resolveRequestUrl(input);

  if (options.isRefreshRequest || requestUrl === AUTH_REFRESH_ENDPOINT) {
    return response;
  }

  const refreshResponse = await fetchWithAuthInternal(
    AUTH_REFRESH_ENDPOINT,
    { method: "POST" },
    { isRefreshRequest: true }
  );

  if (!refreshResponse.ok) {
    return response;
  }

  return executeRequest(input, init);
};

export const fetchWithAuth = (input: RequestInfo | URL, init: RequestInit = {}) =>
  fetchWithAuthInternal(input, init);
