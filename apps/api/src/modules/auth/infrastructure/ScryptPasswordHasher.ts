import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { PasswordHasher } from "../application/ports";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer;
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  async compare(value: string, hashedValue: string): Promise<boolean> {
    const [salt, keyHex] = hashedValue.split(":");
    if (!salt || !keyHex) {
      return false;
    }

    const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer;
    const storedKey = Buffer.from(keyHex, "hex");
    if (storedKey.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedKey, derivedKey);
  }
}
