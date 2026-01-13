import { nameSchema } from "../authValidation";
import type { Result } from "./result";

export class Name {
  private constructor(public readonly value: string) {}

  static create(raw: string): Result<Name> {
    const parsed = nameSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "" };
    }

    return { ok: true, value: new Name(parsed.data) };
  }
}
