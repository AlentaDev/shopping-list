import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { AuthUser } from "@src/context";
import { APP_EVENTS } from "@src/shared/constants/appState";
import { getProviderLogoInfo } from "@src/shared/constants/providers";
import { UI_TEXT } from "@src/shared/constants/ui";
import { useMobileCatalogInteractionMode } from "@src/shared/hooks/useMobileCatalogInteractionMode";
import { useMediaQuery } from "@src/shared/hooks/useMediaQuery";

const HEADER_ACTION_BUTTON_CLASS =
  "rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800";

const HEADER_ICON_BUTTON_CLASS =
  "relative p-2.5 text-slate-700 transition hover:text-emerald-800";

const USER_BADGE_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-sm font-semibold tracking-wide text-white transition hover:bg-emerald-800";

const ACTIVE_NAV_ITEM_CLASS =
  "rounded-full px-4 py-2 text-sm font-medium text-emerald-700 cursor-default";

const MOBILE_ICON_BUTTON_CLASS =
  "flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-emerald-800";

const MOBILE_MENU_ITEM_CLASS = `${HEADER_ACTION_BUTTON_CLASS} w-full text-left`;

const MOBILE_ACTIVE_NAV_ITEM_CLASS = `${ACTIVE_NAV_ITEM_CLASS} block w-full text-left`;

const MOBILE_HEADER_QUERY = "(max-width: 767px)";
const MOBILE_HEADER_SIDE_SLOT_CLASS = "w-[6.5rem]";

const MOBILE_LOGIN_BUTTON_CLASS =
  "rounded-full px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-emerald-800";

const getUserInitials = (name: string) => {
  const normalizedParts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (normalizedParts.length === 0) {
    return "?";
  }

  if (normalizedParts.length === 1) {
    return normalizedParts[0].slice(0, 2).toUpperCase();
  }

  return `${normalizedParts[0][0] ?? ""}${normalizedParts.at(-1)?.[0] ?? ""}`.toUpperCase();
};

type AppHeaderProps = {
  authUser: AuthUser | null;
  isUserMenuOpen: boolean;
  currentPath: string;
  isCatalogRoute: boolean;
  catalogProviderId: string | null;
  linesCount: number;
  onNavigateHome: () => void;
  onOpenCart: () => void;
  onNavigateDownloadApp: () => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onToggleUserMenu: () => void;
  onNavigateLists: () => void;
  onCloseUserMenu: () => void;
  onLogout: () => void;
  userMenuRef: RefObject<HTMLDivElement | null>;
};

export const AppHeader = ({
  authUser,
  isUserMenuOpen,
  currentPath,
  isCatalogRoute,
  catalogProviderId,
  linesCount,
  onNavigateHome,
  onOpenCart,
  onNavigateDownloadApp,
  onNavigateLogin,
  onNavigateRegister,
  onToggleUserMenu,
  onNavigateLists,
  onCloseUserMenu,
  onLogout,
  userMenuRef,
}: AppHeaderProps) => {
  const userInitials = authUser ? getUserInitials(authUser.name) : null;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuContainerRef = useRef<HTMLDivElement | null>(null);
  const isMobileHeaderLayout = useMediaQuery(MOBILE_HEADER_QUERY);
  const isMobileCatalogInteractionMode = useMobileCatalogInteractionMode();
  const isMobileLayout = isCatalogRoute ? isMobileCatalogInteractionMode : isMobileHeaderLayout;
  const catalogProviderLogo = getProviderLogoInfo(catalogProviderId);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [currentPath]);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const eventTarget = event.target;

      if (!(eventTarget instanceof Node)) {
        return;
      }

      if (!mobileMenuContainerRef.current?.contains(eventTarget)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMobileMenuOpen]);

  const navigationItems = useMemo(
    () => [
      {
        key: "home",
        label: UI_TEXT.APP.HOME_LABEL,
        isActive: currentPath === "/",
        onClick: onNavigateHome,
        show: true,
      },
      {
        key: "download-app",
        label: UI_TEXT.APP.DOWNLOAD_APP_LABEL,
        isActive: currentPath === "/app",
        onClick: onNavigateDownloadApp,
        show: true,
      },
      {
        key: "my-lists",
        label: UI_TEXT.APP.MY_LISTS_LABEL,
        isActive: currentPath === "/lists",
        onClick: onNavigateLists,
        show: Boolean(authUser),
      },
    ].filter((item) => item.show),
    [authUser, currentPath, onNavigateDownloadApp, onNavigateHome, onNavigateLists],
  );

  const renderNavItems = (menuKind: "desktop" | "mobile") =>
    navigationItems.map((item) => {
      if (item.isActive) {
        return (
          <span
            key={`${menuKind}-${item.key}`}
            aria-current="page"
            className={menuKind === "mobile" ? MOBILE_ACTIVE_NAV_ITEM_CLASS : ACTIVE_NAV_ITEM_CLASS}
          >
            {item.label}
          </span>
        );
      }

      return (
        <button
          key={`${menuKind}-${item.key}`}
          type="button"
          onClick={() => {
            setIsMobileMenuOpen(false);
            item.onClick();
          }}
          className={menuKind === "mobile" ? MOBILE_MENU_ITEM_CLASS : HEADER_ACTION_BUTTON_CLASS}
        >
          {item.label}
        </button>
      );
    });

  const renderCartButton = (className: string) => (
    <button
      type="button"
      onClick={onOpenCart}
      aria-label={UI_TEXT.APP.CART_BUTTON_LABEL}
      className={className}
    >
      <span className="relative inline-flex">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-[1.45rem] w-[1.45rem]"
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
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold leading-none tabular-nums text-white">
            {linesCount}
          </span>
        ) : null}
      </span>
    </button>
  );

  const authActions = authUser ? (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isUserMenuOpen}
        aria-label={UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL}
        onClick={onToggleUserMenu}
        className={USER_BADGE_BUTTON_CLASS}
      >
        {userInitials}
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
              onCloseUserMenu();
              onLogout();
            }}
            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-red-600 hover:bg-red-50"
          >
            {UI_TEXT.AUTH.USER_MENU.LOGOUT}
          </button>
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4">
        {isMobileLayout ? (
          <div className="relative" ref={mobileMenuContainerRef}>
            <div className="relative flex min-h-10 items-center justify-between gap-3">
              <div className={`${MOBILE_HEADER_SIDE_SLOT_CLASS} flex items-center justify-start gap-1`}>
                <button
                  type="button"
                  aria-label={UI_TEXT.APP.MOBILE_MENU_BUTTON_LABEL}
                  aria-expanded={isMobileMenuOpen}
                  onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
                  className={MOBILE_ICON_BUTTON_CLASS}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 7h16" />
                    <path d="M4 12h16" />
                    <path d="M4 17h16" />
                  </svg>
                </button>
                {renderCartButton(MOBILE_ICON_BUTTON_CLASS)}
              </div>
              <button
                type="button"
                onClick={onNavigateHome}
                className="absolute left-1/2 -translate-x-1/2 text-center text-lg font-semibold tracking-tight text-slate-900 transition hover:text-emerald-700"
              >
                {UI_TEXT.APP.TITLE}
              </button>
              <div className={`${MOBILE_HEADER_SIDE_SLOT_CLASS} ml-auto flex items-center justify-end gap-2`}>
                {authActions ?? (
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className={MOBILE_LOGIN_BUTTON_CLASS}
                  >
                    {UI_TEXT.APP.LOGIN_LABEL}
                  </button>
                )}
              </div>
            </div>

            {isCatalogRoute && catalogProviderLogo ? (
              <div className="mt-3 flex min-h-10 items-center">
                <div className={MOBILE_HEADER_SIDE_SLOT_CLASS} aria-hidden="true" />
                <div className="flex flex-1 justify-center px-2">
                  <img
                    src={catalogProviderLogo.src}
                    alt={catalogProviderLogo.alt}
                    className="h-9 w-auto object-contain"
                  />
                </div>
                <div className={`${MOBILE_HEADER_SIDE_SLOT_CLASS} flex justify-end`}>
                  <button
                    type="button"
                    aria-label={UI_TEXT.CATEGORIES_PANEL.OPEN_BUTTON_LABEL}
                    onClick={() => {
                      window.dispatchEvent(new Event(APP_EVENTS.TOGGLE_CATALOG_CATEGORIES));
                    }}
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16" />
                      <path d="M4 12h16" />
                      <path d="M4 17h16" />
                    </svg>
                    <span>{UI_TEXT.APP.CATEGORIES_LABEL}</span>
                  </button>
                </div>
              </div>
            ) : null}

            {isMobileMenuOpen ? (
              <div
                role="dialog"
                aria-label={UI_TEXT.APP.MOBILE_MENU_TITLE}
                className="absolute left-0 top-full z-20 mt-4 min-w-52 max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-lg"
              >
                <div className="flex flex-col items-stretch gap-2">
                  {renderNavItems("mobile")}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onOpenCart();
                    }}
                    className={MOBILE_MENU_ITEM_CLASS}
                  >
                    {linesCount > 0
                      ? `${UI_TEXT.APP.CART_BUTTON_LABEL} (${linesCount})`
                      : UI_TEXT.APP.CART_BUTTON_LABEL}
                  </button>
                  {!authUser ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateLogin();
                        }}
                        className={MOBILE_MENU_ITEM_CLASS}
                      >
                        {UI_TEXT.APP.LOGIN_LABEL}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          onNavigateRegister();
                        }}
                        className="w-full rounded-full bg-emerald-500 px-4 py-2 text-left text-sm font-medium text-white transition hover:bg-emerald-600"
                      >
                        {UI_TEXT.APP.REGISTER_LABEL}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onNavigateHome}
              className="text-left text-xl font-semibold tracking-tight text-slate-900 transition hover:text-emerald-700 sm:text-2xl"
            >
              {UI_TEXT.APP.TITLE}
            </button>
            {isCatalogRoute && catalogProviderLogo ? (
              <div className="flex flex-1 justify-center px-3">
                <img
                  src={catalogProviderLogo.src}
                  alt={catalogProviderLogo.alt}
                  className="h-10 w-auto object-contain"
                />
              </div>
            ) : null}
            <div className="flex flex-1 items-center justify-end gap-2">
              {renderNavItems("desktop")}
              {renderCartButton(`${HEADER_ICON_BUTTON_CLASS} ${authUser ? "mr-2" : ""}`.trim())}
              {authActions ?? (
                <>
                  <button
                    type="button"
                    onClick={onNavigateLogin}
                    className={HEADER_ACTION_BUTTON_CLASS}
                  >
                    {UI_TEXT.APP.LOGIN_LABEL}
                  </button>
                  <button
                    type="button"
                    onClick={onNavigateRegister}
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
                  >
                    {UI_TEXT.APP.REGISTER_LABEL}
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
