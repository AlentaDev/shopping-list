import { useState } from "react";
import Catalog from "./features/catalog/Catalog";
import ShoppingList from "./features/shopping-list/ShoppingList";
import { useList } from "./context/useList";
import Toast from "./shared/components/toast/Toast";
import { UI_TEXT } from "./shared/constants/ui";
import { LoginForm, RegisterForm, login, register } from "./features/auth";

const App = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const { linesCount } = useList();
  const pathname = window.location.pathname;
  const isLoginRoute = pathname === "/auth/login";
  const isRegisterRoute = pathname === "/auth/register";

  const handleLoginSubmit = async (values: {
    email: string;
    password: string;
  }) => {
    setIsAuthSubmitting(true);
    setAuthErrorMessage(null);

    try {
      await login(values);
    } catch {
      setAuthErrorMessage(UI_TEXT.auth.LOGIN_ERROR_MESSAGE);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    setIsAuthSubmitting(true);
    setAuthErrorMessage(null);

    try {
      await register(values);
    } catch {
      setAuthErrorMessage(UI_TEXT.auth.REGISTER_ERROR_MESSAGE);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  let mainContent = <Catalog isCategoriesOpen={isCategoriesOpen} />;

  if (isLoginRoute) {
    mainContent = (
      <LoginForm
        onSubmit={handleLoginSubmit}
        isSubmitting={isAuthSubmitting}
        errorMessage={authErrorMessage}
      />
    );
  } else if (isRegisterRoute) {
    mainContent = (
      <RegisterForm
        onSubmit={handleRegisterSubmit}
        isSubmitting={isAuthSubmitting}
        errorMessage={authErrorMessage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between gap-3 sm:flex-1 sm:w-auto sm:justify-start">
            <div>
              <p className="text-xl font-semibold sm:text-2xl">
                {UI_TEXT.APP.TITLE}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label={UI_TEXT.APP.CART_BUTTON_LABEL}
              className="relative cursor-pointer"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 .95-.68L21 8H6" />
                <circle cx="10" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              {linesCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold tabular-nums text-white">
                  {linesCount}
                </span>
              ) : null}
            </button>
          </div>
          <div className="mt-4 flex w-full items-center gap-2 sm:mt-0 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isCategoriesOpen
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
              aria-pressed={isCategoriesOpen}
            >
              {UI_TEXT.APP.CATEGORIES_LABEL}
            </button>
            <a
              href="/auth/login"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {UI_TEXT.APP.LOGIN_LABEL}
            </a>
            <a
              href="/auth/register"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {UI_TEXT.APP.REGISTER_LABEL}
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{mainContent}</main>
      <ShoppingList
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <Toast />
    </div>
  );
};

export default App;
