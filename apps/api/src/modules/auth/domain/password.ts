export const PASSWORD_RULES = {
  min: 12,
  max: 20,
};

const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const NUMBER_REGEX = /\d/;
const SPECIAL_REGEX = /[^A-Za-z0-9]/;

export function isPasswordValid(value: string): boolean {
  if (value.length < PASSWORD_RULES.min || value.length > PASSWORD_RULES.max) {
    return false;
  }

  if (!LOWERCASE_REGEX.test(value)) {
    return false;
  }

  if (!UPPERCASE_REGEX.test(value)) {
    return false;
  }

  if (!NUMBER_REGEX.test(value)) {
    return false;
  }

  if (!SPECIAL_REGEX.test(value)) {
    return false;
  }

  return true;
}
