import { AppError } from "../../../shared/errors/appError";

export class DuplicateEmailError extends AppError {
  constructor() {
    super(409, "duplicate_email", "Email already exists");
  }
}

export class InvalidCredentialsError extends AppError {
  constructor() {
    super(401, "invalid_credentials", "Invalid credentials");
  }
}

export class InvalidPasswordError extends AppError {
  constructor() {
    super(400, "invalid_password", "Password is invalid");
  }
}

export class NotAuthenticatedError extends AppError {
  constructor() {
    super(401, "not_authenticated", "Not authenticated");
  }
}

export class InvalidRefreshTokenError extends AppError {
  constructor() {
    super(401, "invalid_refresh_token", "Refresh token is invalid");
  }
}
