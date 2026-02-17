import {
  createAuthRequestLogger,
  type AuthLogMode,
} from "./authRequestLogger";
import {
  AUTH_401_RETRY_PRESETS,
  type Auth401RetryPolicyOptions,
  shouldRetryOnAuth401,
} from "./retryAuthPolicy";
import { ERROR_DISPLAY_MATRIX } from "./errorDisplayMatrix";

const AUTH_REFRESH_ENDPOINT = "/api/auth/refresh";

type FetchWithAuthOptions = RequestInit &
  Auth401RetryPolicyOptions & {
    authLogMode?: AuthLogMode;
  };

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

const logBusinessErrorIfNeeded = (
  logger: ReturnType<typeof createAuthRequestLogger>,
  requestUrl: string,
  init: FetchWithAuthOptions,
  response: Response
) => {
  if (response.status >= 400 && response.status < 500 && response.status !== 401) {
    logger.logBusinessValidationError("request_failed", {
      requestUrl,
      method: init.method,
      status: response.status,
    });
  }
};

const fetchWithAuthInternal = async (
  input: RequestInfo | URL,
  init: FetchWithAuthOptions = {},
  options: InternalOptions = { isRefreshRequest: false }
): Promise<Response> => {
  const logger = createAuthRequestLogger(init.authLogMode);
  const requestUrl = resolveRequestUrl(input);
  const response = await executeRequest(input, init);

  if (response.status !== 401) {
    logBusinessErrorIfNeeded(logger, requestUrl, init, response);
    return response;
  }

  if (!shouldRetryRequestOn401(requestUrl, init, options)) {
    logger.logUnexpectedAuthFailure("received_401_without_retry", {
      requestUrl,
      method: init.method,
      status: response.status,
      userVisible: ERROR_DISPLAY_MATRIX.terminalAuthFailure.userVisible,
    });

    return response;
  }

  logger.logExpectedAuthRefreshEvent("received_401", {
    requestUrl,
    method: init.method,
    status: response.status,
    userVisible: ERROR_DISPLAY_MATRIX.intermediateAuth401Recovered.userVisible,
  });

  const refreshResponse = await fetchWithAuthInternal(
    AUTH_REFRESH_ENDPOINT,
    {
      method: "POST",
      retryPolicyPreset: AUTH_401_RETRY_PRESETS.STRICT,
      authLogMode: init.authLogMode,
    },
    { isRefreshRequest: true }
  );

  if (!refreshResponse.ok) {
    logger.logUnexpectedAuthFailure("refresh_failed", {
      requestUrl,
      method: init.method,
      status: response.status,
      refreshStatus: refreshResponse.status,
      userVisible: ERROR_DISPLAY_MATRIX.terminalAuthFailure.userVisible,
    });

    return response;
  }

  logger.logExpectedAuthRefreshEvent("refresh_succeeded_retrying_request", {
    requestUrl,
    method: init.method,
    status: response.status,
    refreshStatus: refreshResponse.status,
    userVisible: ERROR_DISPLAY_MATRIX.intermediateAuth401Recovered.userVisible,
  });

  const retriedResponse = await executeRequest(input, init);

  if (retriedResponse.status === 401) {
    logger.logUnexpectedAuthFailure("request_failed_after_refresh", {
      requestUrl,
      method: init.method,
      status: retriedResponse.status,
      refreshStatus: refreshResponse.status,
      userVisible: ERROR_DISPLAY_MATRIX.terminalAuthFailure.userVisible,
    });

    return retriedResponse;
  }

  logBusinessErrorIfNeeded(logger, requestUrl, init, retriedResponse);
  return retriedResponse;
};

export const fetchWithAuth = (
  input: RequestInfo | URL,
  init: FetchWithAuthOptions = {}
) => fetchWithAuthInternal(input, init);

export { AUTH_401_RETRY_PRESETS };
export type { FetchWithAuthOptions };
