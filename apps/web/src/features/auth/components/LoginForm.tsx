import { useState, type ChangeEvent, type FormEvent } from "react";
import { UI_TEXT } from "../../../shared/constants/ui";
import { loginSchema, emailSchema, passwordSchema } from "../services/authValidation";
import { Email, Password } from "../services/value-objects";

export type LoginFormValues = {
  email: string;
  password: string;
};

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
};

const LoginForm = ({ onSubmit, isSubmitting = false }: LoginFormProps) => {
  const [fields, setFields] = useState<{
    email: { value: string; touched: boolean; error: string | null };
    password: { value: string; touched: boolean; error: string | null };
  }>({
    email: { value: "", touched: false, error: null },
    password: { value: "", touched: false, error: null },
  });

  const fieldSchemas = {
    email: emailSchema,
    password: passwordSchema,
  };

  const setFieldState = (
    field: keyof LoginFormValues,
    nextValue: string
  ) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], value: nextValue },
    }));
  };

  const validateField = (field: keyof LoginFormValues, value: string) => {
    const result = fieldSchemas[field].safeParse(value);
    return result.success ? null : result.error.issues[0]?.message ?? null;
  };

  const handleChange = (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFieldState(field, event.target.value);
    };

  const handleBlur = (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const error = validateField(field, event.target.value);

      setFields((prev) => ({
        ...prev,
        [field]: { ...prev[field], touched: true, error },
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formValues = {
      email: fields.email.value,
      password: fields.password.value,
    };

    const result = loginSchema.safeParse(formValues);

    if (!result.success) {
      const nextErrors = result.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const key = issue.path[0];
          if (typeof key === "string" && !acc[key]) {
            acc[key] = issue.message;
          }
          return acc;
        },
        {}
      );

      setFields((prev) => ({
        email: {
          ...prev.email,
          touched: true,
          error: nextErrors.email ?? prev.email.error,
        },
        password: {
          ...prev.password,
          touched: true,
          error: nextErrors.password ?? prev.password.error,
        },
      }));
      return;
    }

    const emailResult = Email.create(result.data.email);
    const passwordResult = Password.create(result.data.password);

    if (!emailResult.ok || !passwordResult.ok) {
      setFields((prev) => ({
        email: {
          ...prev.email,
          touched: true,
          error: emailResult.ok ? prev.email.error : emailResult.error,
        },
        password: {
          ...prev.password,
          touched: true,
          error: passwordResult.ok ? prev.password.error : passwordResult.error,
        },
      }));
      return;
    }

    await onSubmit({
      email: emailResult.value.value,
      password: passwordResult.value.value,
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="login-email">
          {UI_TEXT.AUTH.LOGIN.EMAIL_LABEL}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          value={fields.email.value}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          placeholder={UI_TEXT.AUTH.LOGIN.EMAIL_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        {fields.email.touched && fields.email.error ? (
          <p className="text-xs text-red-600">{fields.email.error}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="login-password">
          {UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          value={fields.password.value}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          placeholder={UI_TEXT.AUTH.LOGIN.PASSWORD_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        {fields.password.touched && fields.password.error ? (
          <p className="text-xs text-red-600">{fields.password.error}</p>
        ) : null}
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {UI_TEXT.AUTH.LOGIN.SUBMIT_LABEL}
      </button>
    </form>
  );
};

export default LoginForm;
