import { PasswordHasher } from "../application/ports";
import { hashPassword, verifyPassword } from "../../../shared/security/hash";

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return hashPassword(value);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return verifyPassword(value, hashedValue);
  }
}
