import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import Catalog from "@src/features/catalog/Catalog";
import { ListsContainer } from "@src/features/lists";
import {
  AuthLoggedInNotice,
  AuthScreen,
  type AuthMode,
} from "@src/features/auth";
import { MobileAppDownloadPage } from "@src/features/mobile-app";
import type { LoginFormValues, RegisterFormValues } from "@src/features/auth";
import type { ListDetail, ListSummary } from "@src/features/lists/services/types";
import type { AuthUser } from "@src/context";

const LOGIN_PATH = "/auth/login";
const REGISTER_PATH = "/auth/register";
const LISTS_PATH = "/lists";
const APP_DOWNLOAD_PATH = "/app";

type UseAppShellNavigationArgs = {
  authUser: AuthUser | null;
  authRedirectPending: boolean;
  isAuthSubmitting: boolean;
  authError: string | null;
  isCategoriesOpen: boolean;
  linesCount: number;
  onLogin: (values: LoginFormValues) => Promise<void>;
  onRegister: (values: RegisterFormValues) => Promise<void>;
  onOpenList: (list: ListDetail) => void;
  onStartOpenList: (list: ListSummary) => void;
};

type MainContentParams = {
  authMode: AuthMode | null;
  authUser: AuthUser | null;
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

export const useAppShellNavigation = ({
  authUser,
  authRedirectPending,
  isAuthSubmitting,
  authError,
  isCategoriesOpen,
  linesCount,
  onLogin,
  onRegister,
  onOpenList,
  onStartOpenList,
}: UseAppShellNavigationArgs) => {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname);
  const [authMode, setAuthMode] = useState<AuthMode | null>(() =>
    resolveAuthMode(window.location.pathname),
  );

  const navigate = useCallback((path: string) => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    setAuthMode(resolveAuthMode(path));
  }, []);

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
        linesCount,
        onLogin,
        onRegister,
        onNavigateHome: () => navigate("/"),
        onOpenList,
        onStartOpenList,
      }),
    [
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
      navigate,
      onOpenList,
      onStartOpenList,
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
  linesCount,
  onLogin,
  onRegister,
  onNavigateHome,
  onOpenList,
  onStartOpenList,
}: MainContentParams) {
  if (authMode) {
    if (authUser && authRedirectPending) {
      return createElement(Catalog, { isCategoriesOpen });
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

  return createElement(Catalog, { isCategoriesOpen });
}
