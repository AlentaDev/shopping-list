import type { FormEvent } from "react";
import { UI_TEXT } from "../../../shared/constants/ui";

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
};

type RegisterFormProps = {
  onSubmit: (values: RegisterFormValues) => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
};

const RegisterForm = ({
  onSubmit,
  isSubmitting = false,
  errorMessage = null,
}: RegisterFormProps) => {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    onSubmit({ name, email, password });
  };

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          {UI_TEXT.auth.REGISTER_TITLE}
        </h1>
        <p className="text-sm text-slate-500">
          {UI_TEXT.auth.REGISTER_SUBTITLE}
        </p>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          {UI_TEXT.auth.REGISTER_NAME_LABEL}
          <input
            type="text"
            name="name"
            required
            autoComplete="name"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          {UI_TEXT.auth.REGISTER_EMAIL_LABEL}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
          {UI_TEXT.auth.REGISTER_PASSWORD_LABEL}
          <input
            type="password"
            name="password"
            required
            autoComplete="new-password"
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-emerald-400 focus:outline-none"
          />
        </label>
        {errorMessage ? (
          <p className="text-sm text-rose-500" role="alert">
            {errorMessage}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
            isSubmitting
              ? "cursor-not-allowed bg-slate-300"
              : "bg-emerald-500 hover:bg-emerald-600"
          }`}
        >
          {UI_TEXT.auth.REGISTER_SUBMIT_LABEL}
        </button>
      </form>
    </section>
  );
};

export type { RegisterFormValues };
export default RegisterForm;
