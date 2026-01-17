import { PasswordHasher } from "../application/ports.js";
import { hashPassword, verifyPassword } from "@src/shared/security/hash.js";

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return hashPassword(value);
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    return verifyPassword(value, hashedValue);
  }
}
