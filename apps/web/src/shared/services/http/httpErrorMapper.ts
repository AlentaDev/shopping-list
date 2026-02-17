import { ERROR_DISPLAY_MATRIX } from "./errorDisplayMatrix";

export type HttpDomainErrorCategory =
  | "auth_terminal"
  | "validation_business"
  | "network_offline"
  | "unknown";

export type HttpDomainError = {
  code: string;
  category: HttpDomainErrorCategory;
  userVisible: boolean;
  status?: number;
};

type MapHttpErrorInput = {
  response?: Response;
  error?: unknown;
  fallbackCode: string;
};

const NETWORK_ERROR_CODE = "network_error";
const NOT_AUTHENTICATED_ERROR_CODE = "not_authenticated";

export async function mapHttpErrorToDomainError(
  input: MapHttpErrorInput,
): Promise<HttpDomainError> {
  if (input.error) {
    return {
      code: NETWORK_ERROR_CODE,
      category: "network_offline",
      userVisible: ERROR_DISPLAY_MATRIX.networkOrOffline.userVisible,
    };
  }

  if (!input.response) {
    return {
      code: input.fallbackCode,
      category: "unknown",
      userVisible: false,
    };
  }

  const errorCode = await readErrorCode(input.response);

  if (input.response.status === 401) {
    return {
      code: errorCode ?? NOT_AUTHENTICATED_ERROR_CODE,
      category: "auth_terminal",
      userVisible: ERROR_DISPLAY_MATRIX.terminalAuthFailure.userVisible,
      status: input.response.status,
    };
  }

  if (input.response.status >= 400 && input.response.status < 500) {
    return {
      code: errorCode ?? input.fallbackCode,
      category: "validation_business",
      userVisible: ERROR_DISPLAY_MATRIX.apiValidationOrBusiness.userVisible,
      status: input.response.status,
    };
  }

  return {
    code: errorCode ?? input.fallbackCode,
    category: "unknown",
    userVisible: false,
    status: input.response.status,
  };
}

async function readErrorCode(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as { error?: unknown };
    if (data && typeof data === "object" && typeof data.error === "string") {
      return data.error;
    }
  } catch {
    return null;
  }

  return null;
}
