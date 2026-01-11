import { randomUUID } from "node:crypto";
import { TokenGenerator } from "../application/ports";

export class RandomTokenGenerator implements TokenGenerator {
  generate(): string {
    return randomUUID();
  }
}
