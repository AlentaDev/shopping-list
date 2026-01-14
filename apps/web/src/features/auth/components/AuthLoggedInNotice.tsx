import { useEffect } from "react";
import { UI_TEXT } from "../../../shared/constants/ui";
import type { AuthMode } from "./AuthScreen";

type AuthLoggedInNoticeProps = {
  mode: AuthMode;
  onBack: () => void;
};

const AuthLoggedInNotice = ({ mode, onBack }: AuthLoggedInNoticeProps) => {
  const message =
    mode === "login"
      ? UI_TEXT.AUTH.ALREADY_LOGGED_IN.LOGIN_MESSAGE
      : UI_TEXT.AUTH.ALREADY_LOGGED_IN.REGISTER_MESSAGE;

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      onBack();
    }, 15000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [onBack]);

  return (
    <div className="mx-auto max-w-lg space-y-6">
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
            {UI_TEXT.AUTH.ALREADY_LOGGED_IN.TITLE}
          </h1>
          <p className="text-sm text-slate-600">{message}</p>
          <p className="text-sm text-slate-500">
            {UI_TEXT.AUTH.ALREADY_LOGGED_IN.AUTO_REDIRECT_MESSAGE}
          </p>
        </div>
        <div className="mt-6">
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {UI_TEXT.AUTH.ALREADY_LOGGED_IN.BACK_HOME_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthLoggedInNotice;
