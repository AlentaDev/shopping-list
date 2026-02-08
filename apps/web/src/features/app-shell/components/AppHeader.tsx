import type { RefObject } from "react";
import type { AuthUser } from "@src/context";
import { UI_TEXT } from "@src/shared/constants/ui";

type AppHeaderProps = {
  authUser: AuthUser | null;
  isUserMenuOpen: boolean;
  isCategoriesOpen: boolean;
  linesCount: number;
  onNavigateHome: () => void;
  onOpenCart: () => void;
  onToggleCategories: () => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onToggleUserMenu: () => void;
  onNavigateLists: () => void;
  onCloseUserMenu: () => void;
  onLogout: () => void;
  userMenuRef: RefObject<HTMLDivElement>;
};

export const AppHeader = ({
  authUser,
  isUserMenuOpen,
  isCategoriesOpen,
  linesCount,
  onNavigateHome,
  onOpenCart,
  onToggleCategories,
  onNavigateLogin,
  onNavigateRegister,
  onToggleUserMenu,
  onNavigateLists,
  onCloseUserMenu,
  onLogout,
  userMenuRef,
}: AppHeaderProps) => (
  <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full items-center justify-between gap-3 sm:flex-1 sm:w-auto sm:justify-start">
        <div>
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-left text-xl font-semibold transition hover:text-slate-900 sm:text-2xl"
          >
            {UI_TEXT.APP.TITLE}
          </button>
        </div>
        <button
          type="button"
          onClick={onOpenCart}
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
          onClick={onToggleCategories}
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
              onClick={onToggleUserMenu}
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
                  onClick={onCloseUserMenu}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
                  {UI_TEXT.AUTH.USER_MENU.PROFILE}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    onNavigateLists();
                    onCloseUserMenu();
                  }}
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-slate-700 hover:bg-slate-50"
                >
                  {UI_TEXT.AUTH.USER_MENU.LISTS}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={onLogout}
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
              onClick={onNavigateLogin}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {UI_TEXT.APP.LOGIN_LABEL}
            </button>
            <button
              type="button"
              onClick={onNavigateRegister}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {UI_TEXT.APP.REGISTER_LABEL}
            </button>
          </>
        )}
      </div>
    </div>
  </header>
);
