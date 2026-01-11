import { useState, type ChangeEvent, type FormEvent } from "react";
import { UI_TEXT } from "../../../shared/constants/ui";

export type LoginFormValues = {
  email: string;
  password: string;
};

type LoginFormProps = {
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
  isSubmitting?: boolean;
};

const LoginForm = ({ onSubmit, isSubmitting = false }: LoginFormProps) => {
  const [formValues, setFormValues] = useState<LoginFormValues>({
    email: "",
    password: "",
  });

  const handleChange = (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setFormValues((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formValues);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="login-email">
          {UI_TEXT.AUTH.LOGIN.EMAIL_LABEL}
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          value={formValues.email}
          onChange={handleChange("email")}
          placeholder={UI_TEXT.AUTH.LOGIN.EMAIL_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="login-password">
          {UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL}
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          value={formValues.password}
          onChange={handleChange("password")}
          placeholder={UI_TEXT.AUTH.LOGIN.PASSWORD_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
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
