import { useState, type ChangeEvent, type FormEvent } from "react";
import { UI_TEXT } from "../../../shared/constants/ui";
import {
  emailSchema,
  nameSchema,
  passwordSchema,
  postalCodeSchema,
  registerSchema,
} from "../services/authValidation";
import { Email, Name, Password, PostalCode } from "../services/value-objects";

export type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  postalCode: string;
};

type RegisterFormProps = {
  onSubmit: (values: RegisterFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
};

const RegisterForm = ({ onSubmit, isSubmitting = false }: RegisterFormProps) => {
  const [fields, setFields] = useState<{
    name: { value: string; touched: boolean; error: string | null };
    email: { value: string; touched: boolean; error: string | null };
    password: { value: string; touched: boolean; error: string | null };
    postalCode: { value: string; touched: boolean; error: string | null };
  }>({
    name: { value: "", touched: false, error: null },
    email: { value: "", touched: false, error: null },
    password: { value: "", touched: false, error: null },
    postalCode: { value: "", touched: false, error: null },
  });

  const fieldSchemas = {
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    postalCode: postalCodeSchema,
  };

  const setFieldState = (
    field: keyof RegisterFormValues,
    nextValue: string
  ) => {
    setFields((prev) => ({
      ...prev,
      [field]: { ...prev[field], value: nextValue },
    }));
  };

  const validateField = (field: keyof RegisterFormValues, value: string) => {
    const result = fieldSchemas[field].safeParse(value);
    return result.success ? null : result.error.issues[0]?.message ?? null;
  };

  const handleChange = (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFieldState(field, event.target.value);
    };

  const handleBlur = (field: keyof RegisterFormValues) =>
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
      name: fields.name.value,
      email: fields.email.value,
      password: fields.password.value,
      postalCode: fields.postalCode.value,
    };

    const result = registerSchema.safeParse(formValues);

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
        name: {
          ...prev.name,
          touched: true,
          error: nextErrors.name ?? prev.name.error,
        },
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
        postalCode: {
          ...prev.postalCode,
          touched: true,
          error: nextErrors.postalCode ?? prev.postalCode.error,
        },
      }));
      return;
    }

    const nameResult = Name.create(result.data.name);
    const emailResult = Email.create(result.data.email);
    const passwordResult = Password.create(result.data.password);
    const postalCodeResult = PostalCode.create(result.data.postalCode);

    if (
      !nameResult.ok ||
      !emailResult.ok ||
      !passwordResult.ok ||
      !postalCodeResult.ok
    ) {
      setFields((prev) => ({
        name: {
          ...prev.name,
          touched: true,
          error: nameResult.ok ? prev.name.error : nameResult.error,
        },
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
        postalCode: {
          ...prev.postalCode,
          touched: true,
          error: postalCodeResult.ok
            ? prev.postalCode.error
            : postalCodeResult.error,
        },
      }));
      return;
    }

    await onSubmit({
      name: nameResult.value.value,
      email: emailResult.value.value,
      password: passwordResult.value.value,
      postalCode: postalCodeResult.value.value,
    });
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-name">
          {UI_TEXT.AUTH.REGISTER.NAME_LABEL}
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          value={fields.name.value}
          onChange={handleChange("name")}
          onBlur={handleBlur("name")}
          placeholder={UI_TEXT.AUTH.REGISTER.NAME_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500">{UI_TEXT.AUTH.HINTS.NAME}</p>
        {fields.name.touched && fields.name.error ? (
          <p className="text-xs text-red-600">{fields.name.error}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-email">
          {UI_TEXT.AUTH.REGISTER.EMAIL_LABEL}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={fields.email.value}
          onChange={handleChange("email")}
          onBlur={handleBlur("email")}
          placeholder={UI_TEXT.AUTH.REGISTER.EMAIL_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500">{UI_TEXT.AUTH.HINTS.EMAIL}</p>
        {fields.email.touched && fields.email.error ? (
          <p className="text-xs text-red-600">{fields.email.error}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-password">
          {UI_TEXT.AUTH.REGISTER.PASSWORD_LABEL}
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={fields.password.value}
          onChange={handleChange("password")}
          onBlur={handleBlur("password")}
          placeholder={UI_TEXT.AUTH.REGISTER.PASSWORD_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500">{UI_TEXT.AUTH.HINTS.PASSWORD}</p>
        {fields.password.touched && fields.password.error ? (
          <p className="text-xs text-red-600">{fields.password.error}</p>
        ) : null}
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-postal-code">
          {UI_TEXT.AUTH.REGISTER.POSTAL_CODE_LABEL}
        </label>
        <input
          id="register-postal-code"
          name="postalCode"
          type="text"
          value={fields.postalCode.value}
          onChange={handleChange("postalCode")}
          onBlur={handleBlur("postalCode")}
          placeholder={UI_TEXT.AUTH.REGISTER.POSTAL_CODE_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <p className="text-xs text-slate-500">
          {UI_TEXT.AUTH.HINTS.POSTAL_CODE}
        </p>
        {fields.postalCode.touched && fields.postalCode.error ? (
          <p className="text-xs text-red-600">{fields.postalCode.error}</p>
        ) : null}
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={isSubmitting}
      >
        {UI_TEXT.AUTH.REGISTER.SUBMIT_LABEL}
      </button>
    </form>
  );
};

export default RegisterForm;
