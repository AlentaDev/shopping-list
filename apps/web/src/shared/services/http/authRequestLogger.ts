export const AUTH_LOG_CONTEXT = "auth_http";

type AuthLogCategory =
  | "expected_auth_refresh"
  | "unexpected_auth_failure"
  | "business_validation_error";

export type AuthLogMode = "verbose" | "quiet";

type AuthLogPayload = {
  requestUrl: string;
  method?: string;
  status?: number;
  retryStatus?: number;
  refreshStatus?: number;
  reason?: string;
};

type AuthLog = {
  context: typeof AUTH_LOG_CONTEXT;
  category: AuthLogCategory;
  event: string;
  mode: AuthLogMode;
} & AuthLogPayload;

const AUTH_LOGGER_TAG = "[AUTH_HTTP]";

const authEnv = import.meta as ImportMeta & {
  env?: Record<string, string | undefined>;
};

export const resolveAuthLogMode = (value: string | undefined): AuthLogMode =>
  value === "verbose" ? "verbose" : "quiet";

export const getAuthLogMode = (): AuthLogMode =>
  resolveAuthLogMode(authEnv.env?.VITE_AUTH_LOG_MODE);

const buildLog = (
  mode: AuthLogMode,
  category: AuthLogCategory,
  event: string,
  payload: AuthLogPayload
): AuthLog => ({
  context: AUTH_LOG_CONTEXT,
  category,
  event,
  mode,
  ...payload,
});

export const createAuthRequestLogger = (mode: AuthLogMode = getAuthLogMode()) => ({
  logExpectedAuthRefreshEvent(event: string, payload: AuthLogPayload) {
    if (mode !== "verbose") {
      return;
    }

    console.info(
      AUTH_LOGGER_TAG,
      buildLog(mode, "expected_auth_refresh", event, payload)
    );
  },

  logUnexpectedAuthFailure(event: string, payload: AuthLogPayload) {
    console.error(
      AUTH_LOGGER_TAG,
      buildLog(mode, "unexpected_auth_failure", event, payload)
    );
  },

  logBusinessValidationError(event: string, payload: AuthLogPayload) {
    console.warn(
      AUTH_LOGGER_TAG,
      buildLog(mode, "business_validation_error", event, payload)
    );
  },
});
