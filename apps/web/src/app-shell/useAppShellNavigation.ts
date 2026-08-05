import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Catalog } from "@src/features/catalog";
import { ListsContainer, type ListDetail, type ListSummary } from "@src/features/lists";
import {
  AuthLoggedInNotice,
  AuthScreen,
  type AuthMode,
} from "@src/features/auth";
import { CatalogHome } from "@src/features/home";
import { MobileAppDownloadPage } from "@src/features/mobile-app";
import { SUPPORTED_PROVIDERS } from "@src/shared/constants/providers";
import type { LoginFormValues, RegisterFormValues } from "@src/features/auth";
import type { AuthUser } from "@src/context";
import type { DraftProviderConflictInput } from "@src/context/useDraftProviderConflict";
import { APP_EVENTS } from "@src/shared/constants/appState";

const LOGIN_PATH = "/auth/login";
const REGISTER_PATH = "/auth/register";
const LISTS_PATH = "/lists";
const APP_DOWNLOAD_PATH = "/app";
const CATALOG_ALIAS_PATH = "/catalog";
const LAST_PROVIDER_STORAGE_KEY = "lastProvider";

type UseAppShellNavigationArgs = {
  authUser: AuthUser | null;
  authRedirectPending: boolean;
  isAuthSubmitting: boolean;
  authError: string | null;
  linesCount: number;
  onLogin: (values: LoginFormValues) => Promise<void>;
  onRegister: (values: RegisterFormValues) => Promise<void>;
  onOpenList: (list: ListDetail) => void;
  onStartOpenList: (list: ListSummary) => void;
  homeDraftProviderId?: string | null;
  showAnonymousDraftGuidance?: boolean;
  onSelectHomeProvider: (providerId: string) => void;
  onRequestActiveEditConflict: (input: {
    currentProviderId: string;
    requestedProviderId: string;
  }) => void;
  onRequestDraftProviderConflict?: (
    input: DraftProviderConflictInput,
  ) => Promise<boolean>;
};

type MainContentParams = {
  authMode: AuthMode | null;
  authUser: AuthUser | null;
  authRedirectPending: boolean;
  currentPath: string;
  isAuthSubmitting: boolean;
  authError: string | null;
  linesCount: number;
  onLogin: (values: LoginFormValues) => Promise<void>;
  onRegister: (values: RegisterFormValues) => Promise<void>;
  onNavigateHome: () => void;
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onNavigateCatalogCategory: (providerId: string, categoryId: string) => void;
  onOpenList: (list: ListDetail) => void;
  onStartOpenList: (list: ListSummary) => void;
  homeDraftProviderId?: string | null;
  showAnonymousDraftGuidance?: boolean;
  onSelectHomeProvider: (providerId: string) => void;
  onRequestActiveEditConflict: (input: {
    currentProviderId: string;
    requestedProviderId: string;
  }) => void;
  onRequestDraftProviderConflict?: (
    input: DraftProviderConflictInput,
  ) => Promise<boolean>;
};

export const useAppShellNavigation = ({
  authUser,
  authRedirectPending,
  isAuthSubmitting,
  authError,
  linesCount,
  onLogin,
  onRegister,
  onOpenList,
  onStartOpenList,
  homeDraftProviderId,
  showAnonymousDraftGuidance,
  onSelectHomeProvider,
  onRequestActiveEditConflict,
  onRequestDraftProviderConflict,
}: UseAppShellNavigationArgs) => {
  const initialPath = resolveCatalogAlias(window.location.pathname);
  const [currentPath, setCurrentPath] = useState(() => initialPath);
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    resolveAuthMode(initialPath),
  );

  useEffect(() => {
    persistLastProvider(initialPath);

    if (window.location.pathname !== initialPath) {
      window.history.replaceState({}, "", initialPath);
    }
  }, [initialPath]);

  const navigate = useCallback((path: string) => {
    const nextPath = resolveCatalogAlias(path);
    if (window.location.pathname === nextPath) {
      return;
    }

    persistLastProvider(nextPath);
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new Event(APP_EVENTS.CLOSE_MOBILE_HEADER_MENU));
    setCurrentPath(nextPath);
    setAuthMode(resolveAuthMode(nextPath));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = resolveCatalogAlias(window.location.pathname);
      persistLastProvider(path);
      if (window.location.pathname !== path) {
        window.history.replaceState({}, "", path);
      }
      window.dispatchEvent(new Event(APP_EVENTS.CLOSE_MOBILE_HEADER_MENU));
      setCurrentPath(path);
      setAuthMode(resolveAuthMode(path));
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const mainContent = useMemo(
    () =>
      resolveMainContent({
        authMode,
        authUser,
        authRedirectPending,
        currentPath,
        isAuthSubmitting,
        authError,
        linesCount,
        onLogin,
        onRegister,
        onNavigateHome: () => navigate("/"),
        onNavigateLogin: () => navigate(LOGIN_PATH),
        onNavigateRegister: () => navigate(REGISTER_PATH),
        onNavigateCatalogCategory: (providerId: string, categoryId: string) =>
          navigate(`/${providerId}/catalog/${categoryId}`),
        onOpenList,
        onStartOpenList,
        homeDraftProviderId,
        showAnonymousDraftGuidance,
        onSelectHomeProvider,
        onRequestActiveEditConflict,
        onRequestDraftProviderConflict,
      }),
    [
      authMode,
      authUser,
      authRedirectPending,
      currentPath,
      isAuthSubmitting,
      authError,
      linesCount,
      onLogin,
      onRegister,
      navigate,
      onOpenList,
      onStartOpenList,
      homeDraftProviderId,
      showAnonymousDraftGuidance,
      onSelectHomeProvider,
      onRequestActiveEditConflict,
      onRequestDraftProviderConflict,
    ],
  );

  return {
    authMode,
    currentPath,
    navigate,
    mainContent,
  };
};

function resolveAuthMode(pathname: string): AuthMode | null {
  if (pathname === LOGIN_PATH) return "login";
  if (pathname === REGISTER_PATH) return "register";
  if (pathname.startsWith("/auth/")) return "login";
  return null;
}

function resolveMainContent({
  authMode,
  authUser,
  authRedirectPending,
  currentPath,
  isAuthSubmitting,
  authError,
  linesCount,
  onLogin,
  onRegister,
  onNavigateHome,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateCatalogCategory,
  onOpenList,
  onStartOpenList,
  homeDraftProviderId,
  showAnonymousDraftGuidance,
  onSelectHomeProvider,
  onRequestActiveEditConflict,
  onRequestDraftProviderConflict,
}: MainContentParams) {
  if (authMode) {
    if (authUser && authRedirectPending) {
      return createElement(Catalog);
    }

    return authUser
      ? createElement(AuthLoggedInNotice, { mode: authMode, onBack: onNavigateHome })
      : createElement(AuthScreen, {
          mode: authMode,
          isSubmitting: isAuthSubmitting,
          errorMessage: authError,
          onLogin,
          onRegister,
          onBack: onNavigateHome,
          onNavigateToLogin: onNavigateLogin,
          onNavigateToRegister: onNavigateRegister,
        });
  }

  if (currentPath === LISTS_PATH) {
    return authUser
      ? createElement(ListsContainer, {
          onOpenList,
          onStartOpenList,
          hasDraftItems: linesCount > 0,
          onRequestActiveEditConflict,
          onRequestDraftProviderConflict,
        })
      : createElement(AuthScreen, {
          mode: "login",
          isSubmitting: isAuthSubmitting,
          errorMessage: authError,
          onLogin,
          onRegister,
          onBack: onNavigateHome,
          onNavigateToLogin: onNavigateLogin,
          onNavigateToRegister: onNavigateRegister,
        });
  }

  if (currentPath === APP_DOWNLOAD_PATH) {
    return createElement(MobileAppDownloadPage);
  }

  if (currentPath === "/") {
    return createElement(CatalogHome, {
      draftProviderId: homeDraftProviderId,
      showAnonymousDraftGuidance,
      onSelectProvider: onSelectHomeProvider,
    });
  }

  const catalogPath = parseCatalogPath(currentPath);

  if (catalogPath) {
    return createElement(Catalog, {
      providerId: catalogPath.providerId,
      initialCategoryId: catalogPath.categoryId,
      onCategoryRouteChange: (categoryId: string) => {
        onNavigateCatalogCategory(catalogPath.providerId, categoryId);
      },
      onRequestActiveEditConflict,
      onRequestDraftProviderConflict,
    });
  }

  return createElement(CatalogHome, {
    draftProviderId: homeDraftProviderId,
    showAnonymousDraftGuidance,
    onSelectProvider: onSelectHomeProvider,
  });
}

function parseCatalogPath(pathname: string): { providerId: string; categoryId?: string } | null {
  const match = pathname.match(/^\/([^/]+)\/catalog(?:\/([^/]+))?$/);
  if (!match) {
    return null;
  }

  return {
    providerId: match[1],
    categoryId: match[2],
  };
}

function resolveCatalogAlias(pathname: string): string {
  if (pathname === CATALOG_ALIAS_PATH) {
    const lastProvider = window.localStorage.getItem(LAST_PROVIDER_STORAGE_KEY);
    return lastProvider ? resolveCatalogAlias(`/${lastProvider}/catalog`) : "/";
  }

  const catalogPath = parseCatalogPath(pathname);
  if (
    catalogPath &&
    !SUPPORTED_PROVIDERS.some((provider) => provider.id === catalogPath.providerId)
  ) {
    return "/mercadona/catalog";
  }

  return pathname;
}

function persistLastProvider(pathname: string): void {
  const providerId = parseCatalogPath(pathname)?.providerId;

  if (!providerId) {
    return;
  }

  window.localStorage.setItem(LAST_PROVIDER_STORAGE_KEY, providerId);
}
