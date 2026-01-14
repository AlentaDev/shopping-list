import { AppError } from "../../../shared/errors/appError";
import { API_ERROR_MESSAGES } from "../../../shared/constants/apiErrorMessages";

export class DuplicateEmailError extends AppError {
  constructor() {
    super(409, "duplicate_email", API_ERROR_MESSAGES.duplicateEmail);
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "invalid_credentials", API_ERROR_MESSAGES.invalidCredentials);
  }
}

export class NotAuthenticatedError extends AppError {
  constructor() {
    super(401, "not_authenticated", API_ERROR_MESSAGES.notAuthenticated);
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super(401, "invalid_refresh_token", API_ERROR_MESSAGES.invalidRefreshToken);
  }
}
