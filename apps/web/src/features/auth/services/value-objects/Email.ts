import { emailSchema } from "../authValidation";
import type { Result } from "./result";

export class Email {
  readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }

  static create(raw: string): Result<Email> {
    const parsed = emailSchema.safeParse(raw);

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "" };
    }

    return { ok: true, value: new Email(parsed.data) };
  }
}
