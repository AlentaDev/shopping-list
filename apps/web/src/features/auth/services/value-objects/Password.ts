import { passwordSchema } from "../authValidation";
import type { Result } from "./result";

export class Password {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Password> {
    const parsed = passwordSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "" };
    }

    return { ok: true, value: new Password(parsed.data) };
  }
}
