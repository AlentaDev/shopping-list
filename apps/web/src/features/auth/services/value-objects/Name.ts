import { nameSchema } from "@src/features/auth/services/authValidation";
import type { Result } from "./result";

export class Name {
  readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Result<Name> {
    const parsed = nameSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "" };
    }

    return { ok: true, value: new Name(parsed.data) };
  }
}
