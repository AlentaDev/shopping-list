import { postalCodeSchema } from "../authValidation";
import type { Result } from "./result";

export class PostalCode {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<PostalCode> {
    const parsed = postalCodeSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "" };
    }

    return { ok: true, value: new PostalCode(parsed.data) };
  }
}
