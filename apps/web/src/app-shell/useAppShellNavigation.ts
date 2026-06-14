import { Fragment, createElement, useCallback, useEffect, useMemo, useState } from "react";
import { Catalog } from "@src/features/catalog";
import { ListsContainer, type ListDetail, type ListSummary } from "@src/features/lists";
import {
  AuthLoggedInNotice,
  AuthScreen,
  type AuthMode,
} from "@src/features/auth";
import { MobileAppDownloadPage } from "@src/features/mobile-app";
import type { LoginFormValues, RegisterFormValues } from "@src/features/auth";
import type { AuthUser } from "@src/context";
import { CatalogHome } from "./components/CatalogHome";

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
  isCategoriesOpen: boolean;
  openMobileCategoriesRequestKey: number;
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
};

type MainContentParams = {
  authMode: AuthMode | null;
  authUser: AuthUser | null;
  authRedirectPending: boolean;
  currentPath: string;
  isAuthSubmitting: boolean;
  authError: string | null;
  isCategoriesOpen: boolean;
  openMobileCategoriesRequestKey: number;
  linesCount: number;
  onLogin: (values: LoginFormValues) => Promise<void>;
  onRegister: (values: RegisterFormValues) => Promise<void>;
  onNavigateHome: () => void;
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
};

export const useAppShellNavigation = ({
  authUser,
  authRedirectPending,
  isAuthSubmitting,
  authError,
  isCategoriesOpen,
  openMobileCategoriesRequestKey,
  linesCount,
  onLogin,
  onRegister,
  onOpenList,
  onStartOpenList,
  homeDraftProviderId,
  showAnonymousDraftGuidance,
  onSelectHomeProvider,
  onRequestActiveEditConflict,
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
    setCurrentPath(nextPath);
    setAuthMode(resolveAuthMode(nextPath));
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const path = resolveCatalogAlias(window.location.pathname);
      persistLastProvider(path);
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
        isCategoriesOpen,
        openMobileCategoriesRequestKey,
        linesCount,
        onLogin,
        onRegister,
        onNavigateHome: () => navigate("/"),
        onNavigateCatalogCategory: (providerId: string, categoryId: string) =>
          navigate(`/${providerId}/catalog/${categoryId}`),
        onOpenList,
        onStartOpenList,
        homeDraftProviderId,
        showAnonymousDraftGuidance,
        onSelectHomeProvider,
        onRequestActiveEditConflict,
      }),
    [
      authMode,
      authUser,
      authRedirectPending,
      currentPath,
      isAuthSubmitting,
      authError,
      isCategoriesOpen,
      openMobileCategoriesRequestKey,
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
  isCategoriesOpen,
  openMobileCategoriesRequestKey,
  linesCount,
  onLogin,
  onRegister,
  onNavigateHome,
  onNavigateCatalogCategory,
  onOpenList,
  onStartOpenList,
  homeDraftProviderId,
  showAnonymousDraftGuidance,
  onSelectHomeProvider,
  onRequestActiveEditConflict,
}: MainContentParams) {
  if (authMode) {
    if (authUser && authRedirectPending) {
      return createElement(Catalog, {
        isCategoriesOpen,
        openMobileCategoriesRequestKey,
      });
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
        });
  }

  if (currentPath === LISTS_PATH) {
    return authUser
      ? createElement(ListsContainer, {
          onOpenList,
          onStartOpenList,
          hasDraftItems: linesCount > 0,
          onRequestActiveEditConflict,
        })
      : createElement(AuthScreen, {
          mode: "login",
          isSubmitting: isAuthSubmitting,
          errorMessage: authError,
          onLogin,
          onRegister,
          onBack: onNavigateHome,
        });
  }

  if (currentPath === APP_DOWNLOAD_PATH) {
    return createElement(MobileAppDownloadPage);
  }

  if (currentPath === "/") {
    if (authUser) {
      return createElement(
        Fragment,
        null,
        createElement(CatalogHome, {
          draftProviderId: homeDraftProviderId,
          showAnonymousDraftGuidance,
          onSelectProvider: onSelectHomeProvider,
        }),
        createElement(ListsContainer, {
          onOpenList,
          onStartOpenList,
          hasDraftItems: linesCount > 0,
          onRequestActiveEditConflict,
        }),
      );
    }

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
      isCategoriesOpen,
      openMobileCategoriesRequestKey,
      onRequestActiveEditConflict,
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
  if (pathname !== CATALOG_ALIAS_PATH) {
    return pathname;
  }

  const lastProvider = window.localStorage.getItem(LAST_PROVIDER_STORAGE_KEY);
  return lastProvider ? `/${lastProvider}/catalog` : "/";
}

function persistLastProvider(pathname: string): void {
  const providerId = parseCatalogPath(pathname)?.providerId;

  if (!providerId) {
    return;
  }

  window.localStorage.setItem(LAST_PROVIDER_STORAGE_KEY, providerId);
}
