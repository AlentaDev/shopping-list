import { useEffect, useState } from "react";
import Catalog from "./features/catalog/Catalog";
import ShoppingList from "./features/shopping-list/ShoppingList";
import { useList } from "./context/useList";
import Toast from "./shared/components/toast/Toast";
import { UI_TEXT } from "./shared/constants/ui";
import {
  AuthLoggedInNotice,
  AuthScreen,
  type AuthMode,
  loginUser,
  logoutUser,
  registerUser,
} from "./features/auth";
import type {
  AuthUser,
  LoginFormValues,
  RegisterFormValues,
} from "./features/auth";

const App = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    resolveAuthMode(window.location.pathname)
  );
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { linesCount } = useList();

  useEffect(() => {
    const handlePopState = () => {
      setAuthMode(resolveAuthMode(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setAuthMode(resolveAuthMode(path));
  };

  const handleRegister = async (values: RegisterFormValues) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const user = await registerUser(values);
      setAuthUser(user);
      navigate("/");
    } catch {
      setAuthError(UI_TEXT.AUTH.ERROR_MESSAGE);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogin = async (values: LoginFormValues) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const user = await loginUser(values);
      setAuthUser(user);
      navigate("/");
    } catch {
      setAuthError(UI_TEXT.AUTH.ERROR_MESSAGE);
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      setIsUserMenuOpen(false);
      navigate("/");
    } catch {
      setAuthError(UI_TEXT.AUTH.ERROR_MESSAGE);
    }
  };

  let mainContent = <Catalog isCategoriesOpen={isCategoriesOpen} />;

  if (authMode) {
    mainContent = authUser ? (
      <AuthLoggedInNotice mode={authMode} onBack={() => navigate("/")} />
    ) : (
      <AuthScreen
        mode={authMode}
        isSubmitting={isAuthSubmitting}
        errorMessage={authError}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onBack={() => navigate("/")}
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
            {authUser ? (
              <div className="relative">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL}
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {UI_TEXT.AUTH.USER_MENU.GREETING_PREFIX} {authUser.name}
                </button>
                {isUserMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                      {UI_TEXT.AUTH.USER_MENU.PROFILE}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                    >
                      {UI_TEXT.AUTH.USER_MENU.LISTS}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex w-full items-center rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      {UI_TEXT.AUTH.USER_MENU.LOGOUT}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate("/auth/login")}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {UI_TEXT.APP.LOGIN_LABEL}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/auth/register")}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {UI_TEXT.APP.REGISTER_LABEL}
                </button>
              </>
            )}
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

function resolveAuthMode(pathname: string): AuthMode | null {
  if (pathname === "/auth/login") {
    return "login";
  }

  if (pathname === "/auth/register") {
    return "register";
  }

  return null;
}

export default App;
