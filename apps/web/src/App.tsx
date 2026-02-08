import { useEffect, useState, useRef } from "react";
import Catalog from "@src/features/catalog/Catalog";
import { Lists } from "@src/features/lists";
import ShoppingList from "@src/features/shopping-list/ShoppingList";
import { useList } from "@src/context/useList";
import { useAuth } from "@src/context/useAuth";
import Toast from "@src/shared/components/toast/Toast";
import { UI_TEXT } from "@src/shared/constants/ui";
import { APP_EVENTS } from "@src/shared/constants/appState";
import {
  AuthLoggedInNotice,
  AuthScreen,
  type AuthMode,
} from "@src/features/auth";
import type { LoginFormValues, RegisterFormValues } from "@src/features/auth";
import type {
  ListDetail,
  ListItem as RemoteListItem,
  ListSummary,
} from "@src/features/lists/services/types";
import {
  LIST_STATUS,
  type ListStatus as ShoppingListStatus,
} from "@src/shared/domain/listStatus";
import type { ShoppingListItem } from "@src/features/shopping-list/types";

const LOGIN_PATH = "/auth/login";
const LISTS_PATH = "/lists";
const CATALOG_PATH = "/";

const App = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState(() =>
    window.location.pathname,
  );
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    resolveAuthMode(window.location.pathname),
  );
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [currentListStatus, setCurrentListStatus] =
    useState<ShoppingListStatus>(LIST_STATUS.LOCAL_DRAFT);
  const [currentListIsEditing, setCurrentListIsEditing] =
    useState<boolean>(false);
  const [isListLoading, setIsListLoading] = useState(false);
  const [currentListTitle, setCurrentListTitle] = useState<string>(
    UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
  );
  const [authRedirectPending, setAuthRedirectPending] = useState(false);
  const { linesCount, setItems } = useList();
  const {
    authUser,
    isAuthSubmitting,
    authError,
    isUserMenuOpen,
    setIsUserMenuOpen,
    login,
    register,
    logout,
  } = useAuth();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigate = (path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    setAuthMode(resolveAuthMode(path));
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      setAuthMode(resolveAuthMode(path));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    const handleOpenCart = () => {
      setIsCartOpen(true);
    };

    window.addEventListener(APP_EVENTS.OPEN_CART, handleOpenCart);
    return () => {
      window.removeEventListener(APP_EVENTS.OPEN_CART, handleOpenCart);
    };
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen, setIsUserMenuOpen]);

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setAuthRedirectPending(true);
      await register(values);
      navigate("/");
      setAuthRedirectPending(false);
    } catch {
      setAuthRedirectPending(false);
      // Error is already handled by AuthProvider and displayed via authError
    }
  };

  const handleLogin = async (values: LoginFormValues) => {
    try {
      setAuthRedirectPending(true);
      await login(values);
      navigate("/");
      setAuthRedirectPending(false);
    } catch {
      setAuthRedirectPending(false);
      // Error is already handled by AuthProvider and displayed via authError
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch {
      // Error is already handled by AuthProvider and displayed via authError
    }
  };

  const handleOpenList = (list: ListDetail) => {
    setItems(mapListItems(list.items));
    setCurrentListId(list.id);
    setCurrentListStatus(resolveShoppingListStatus(list.status));
    setCurrentListTitle(list.title);
    setCurrentListIsEditing(list.isEditing);
    setIsListLoading(false);
    setIsCartOpen(true);
  };

  const handleStartOpenList = (list: ListSummary) => {
    setCurrentListId(list.id);
    setCurrentListStatus(resolveShoppingListStatus(list.status));
    setCurrentListTitle(list.title);
    setCurrentListIsEditing(list.isEditing);
    setIsListLoading(true);
    setIsCartOpen(true);
  };

  const mainContent = resolveMainContent({
    authMode,
    authUser,
    authRedirectPending,
    currentPath,
    isAuthSubmitting,
    authError,
    isCategoriesOpen,
    linesCount,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onNavigateHome: () => navigate("/"),
    onOpenList: handleOpenList,
    onStartOpenList: handleStartOpenList,
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between gap-3 sm:flex-1 sm:w-auto sm:justify-start">
            <div>
              <button
                type="button"
                onClick={() => navigate("/")}
                className="text-left text-xl font-semibold transition hover:text-slate-900 sm:text-2xl"
              >
                {UI_TEXT.APP.TITLE}
              </button>
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
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  aria-label={UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
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
                      onClick={() => {
                        navigate(LISTS_PATH);
                        setIsUserMenuOpen(false);
                      }}
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
                  onClick={() => navigate(LOGIN_PATH)}
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

      <main className="mx-auto max-w-7xl px-4 py-8">
        <div
          key={`${currentPath}-${authMode ?? "main"}`}
          className="page-transition"
          data-testid="page-transition"
        >
          {mainContent}
        </div>
      </main>
      <ShoppingList
        key={`${currentListId ?? "local"}-${currentListTitle}`}
        isOpen={isCartOpen}
        onClose={() => {
          setIsCartOpen(false);
          setIsListLoading(false);
        }}
        onAddMoreProducts={() => {
          if (currentPath !== CATALOG_PATH) {
            navigate(CATALOG_PATH);
          }
        }}
        initialListId={currentListId}
        initialListStatus={currentListStatus}
        initialListTitle={currentListTitle}
        initialListIsEditing={currentListIsEditing}
        isLoading={isListLoading}
      />
      <Toast />
    </div>
  );
};

function resolveAuthMode(pathname: string): AuthMode | null {
  if (pathname === LOGIN_PATH) {
    return "login";
  }

  if (pathname === "/auth/register") {
    return "register";
  }

  return null;
}

type MainContentParams = {
  authMode: AuthMode | null;
  authUser: ReturnType<typeof useAuth>["authUser"];
  authRedirectPending: boolean;
  currentPath: string;
  isAuthSubmitting: boolean;
  authError: string | null;
  isCategoriesOpen: boolean;
  linesCount: number;
  onLogin: (values: LoginFormValues) => Promise<void>;
  onRegister: (values: RegisterFormValues) => Promise<void>;
  onNavigateHome: () => void;
  onOpenList: (list: ListDetail) => void;
  onStartOpenList: (list: ListSummary) => void;
};

function resolveMainContent({
  authMode,
  authUser,
  authRedirectPending,
  currentPath,
  isAuthSubmitting,
  authError,
  isCategoriesOpen,
  linesCount,
  onLogin,
  onRegister,
  onNavigateHome,
  onOpenList,
  onStartOpenList,
}: MainContentParams) {
  if (authMode) {
    if (authUser && authRedirectPending) {
      return <Catalog isCategoriesOpen={isCategoriesOpen} />;
    }

    return authUser ? (
      <AuthLoggedInNotice mode={authMode} onBack={onNavigateHome} />
    ) : (
      <AuthScreen
        mode={authMode}
        isSubmitting={isAuthSubmitting}
        errorMessage={authError}
        onLogin={onLogin}
        onRegister={onRegister}
        onBack={onNavigateHome}
      />
    );
  }

  if (currentPath === LISTS_PATH) {
    return authUser ? (
      <Lists
        onOpenList={onOpenList}
        onStartOpenList={onStartOpenList}
        hasDraftItems={linesCount > 0}
      />
    ) : (
      <AuthScreen
        mode="login"
        isSubmitting={isAuthSubmitting}
        errorMessage={authError}
        onLogin={onLogin}
        onRegister={onRegister}
        onBack={onNavigateHome}
      />
    );
  }

  return <Catalog isCategoriesOpen={isCategoriesOpen} />;
}

const mapListItems = (items: RemoteListItem[]): ShoppingListItem[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    category: "",
    thumbnail: item.thumbnail ?? null,
    price: item.price ?? null,
    quantity: item.qty,
  }));

const resolveShoppingListStatus = (
  status?: string,
): ShoppingListStatus => {
  switch (status) {
    case LIST_STATUS.ACTIVE:
      return LIST_STATUS.ACTIVE;
    case LIST_STATUS.COMPLETED:
      return LIST_STATUS.COMPLETED;
    case LIST_STATUS.DRAFT:
      return LIST_STATUS.DRAFT;
    default:
      return LIST_STATUS.DRAFT;
  }
};

export default App;
