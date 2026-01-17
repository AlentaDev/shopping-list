import { UI_TEXT } from "@src/shared/constants/ui";
import LoginForm, { type LoginFormValues } from "./LoginForm";
import RegisterForm, { type RegisterFormValues } from "./RegisterForm";

export type AuthMode = "login" | "register";

type AuthScreenProps = {
  mode: AuthMode;
  isSubmitting?: boolean;
  errorMessage?: string | null;
  onLogin: (values: LoginFormValues) => void | Promise<void>;
  onRegister: (values: RegisterFormValues) => void | Promise<void>;
  onBack: () => void;
};

const AuthScreen = ({
  mode,
  isSubmitting = false,
  errorMessage,
  onLogin,
  onRegister,
  onBack,
}: AuthScreenProps) => {
  const isLogin = mode === "login";

  return (
    <div className="mx-auto max-w-lg space-y-6" data-testid="auth-screen">
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
      >
        {UI_TEXT.AUTH.BACK_TO_HOME}
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">
            {isLogin ? UI_TEXT.AUTH.LOGIN.TITLE : UI_TEXT.AUTH.REGISTER.TITLE}
          </h1>
          <p className="text-sm text-slate-600">
            {isLogin
              ? UI_TEXT.AUTH.LOGIN.SUBTITLE
              : UI_TEXT.AUTH.REGISTER.SUBTITLE}
          </p>
        </div>
        <div className="mt-6">
          {isLogin ? (
            <LoginForm onSubmit={onLogin} isSubmitting={isSubmitting} />
          ) : (
            <RegisterForm onSubmit={onRegister} isSubmitting={isSubmitting} />
          )}
        </div>
        {errorMessage ? (
          <p className="mt-4 text-sm text-red-600">{errorMessage}</p>
        ) : null}
      </div>
    </div>
  );
};

export default AuthScreen;
