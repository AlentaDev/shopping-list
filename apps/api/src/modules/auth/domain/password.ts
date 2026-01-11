const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 20;

export class Password {
  private constructor(readonly value: string) {}

  static create(value: string): Password {
    const length = value.length;

    if (length < PASSWORD_MIN_LENGTH || length > PASSWORD_MAX_LENGTH) {
      throw new Error("password_length_invalid");
    }

    if (!/[a-z]/.test(value)) {
      throw new Error("password_missing_lowercase");
    }

    if (!/[A-Z]/.test(value)) {
      throw new Error("password_missing_uppercase");
    }

    if (!/\d/.test(value)) {
      throw new Error("password_missing_number");
    }

    if (!/[^A-Za-z0-9]/.test(value)) {
      throw new Error("password_missing_special");
    }

    return new Password(value);
  }
}
