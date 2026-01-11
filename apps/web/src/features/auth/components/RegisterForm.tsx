import { useState, type ChangeEvent, type FormEvent } from "react";
import { UI_TEXT } from "../../../shared/constants/ui";

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
  const [formValues, setFormValues] = useState<RegisterFormValues>({
    name: "",
    email: "",
    password: "",
    postalCode: "",
  });

  const handleChange = (field: keyof RegisterFormValues) =>
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
        <label className="text-sm font-medium" htmlFor="register-name">
          {UI_TEXT.AUTH.REGISTER.NAME_LABEL}
        </label>
        <input
          id="register-name"
          name="name"
          type="text"
          value={formValues.name}
          onChange={handleChange("name")}
          placeholder={UI_TEXT.AUTH.REGISTER.NAME_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-email">
          {UI_TEXT.AUTH.REGISTER.EMAIL_LABEL}
        </label>
        <input
          id="register-email"
          name="email"
          type="email"
          value={formValues.email}
          onChange={handleChange("email")}
          placeholder={UI_TEXT.AUTH.REGISTER.EMAIL_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-password">
          {UI_TEXT.AUTH.REGISTER.PASSWORD_LABEL}
        </label>
        <input
          id="register-password"
          name="password"
          type="password"
          value={formValues.password}
          onChange={handleChange("password")}
          placeholder={UI_TEXT.AUTH.REGISTER.PASSWORD_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="register-postal-code">
          {UI_TEXT.AUTH.REGISTER.POSTAL_CODE_LABEL}
        </label>
        <input
          id="register-postal-code"
          name="postalCode"
          type="text"
          value={formValues.postalCode}
          onChange={handleChange("postalCode")}
          placeholder={UI_TEXT.AUTH.REGISTER.POSTAL_CODE_PLACEHOLDER}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          required
        />
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
