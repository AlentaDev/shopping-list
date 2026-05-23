import { useEffect, useState, useRef } from "react";
import {
  ShoppingList,
  adaptListStatusToShoppingListStatus,
  adaptListToShoppingListState,
} from "@src/features/shopping-list";
import { useList } from "@src/context/useList";
import { useAuth } from "@src/context/useAuth";
import { useToast } from "@src/context/useToast";
import { useApiAwake } from "@src/context/ApiAwakeContext";
import Toast from "@src/shared/components/toast/Toast";
import { UI_TEXT } from "@src/shared/constants/ui";
import { APP_EVENTS } from "@src/shared/constants/appState";
import { AppHeader } from "@src/app-shell/components/AppHeader";
import { useAppShellNavigation } from "@src/app-shell/useAppShellNavigation";
import type { LoginFormValues, RegisterFormValues } from "@src/features/auth";
import type {
  ListDetail,
  ListSummary,
} from "@src/features/lists";
import {
  LIST_STATUS,
  type ListStatus as ShoppingListStatus,
} from "@src/shared/domain/listStatus";
import { isMobileCatalogInteractionMode } from "@src/shared/utils/isMobileCatalogInteractionMode";

const CATALOG_PATH = "/catalog";
type HandshakeStatus = "WAITING" | "READY";

export const AppShell = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [openMobileCategoriesRequestKey, setOpenMobileCategoriesRequestKey] =
    useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [currentListStatus, setCurrentListStatus] =
    useState<ShoppingListStatus>(LIST_STATUS.LOCAL_DRAFT);
  const [isListLoading, setIsListLoading] = useState(false);
  const [currentListIsEditing, setCurrentListIsEditing] = useState(false);
  const [currentListTitle, setCurrentListTitle] = useState<string>(
    UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
  );
  const [authRedirectPending, setAuthRedirectPending] = useState(false);
  const { linesCount, setItems } = useList();
  const { showToast } = useToast();
  const { apiAwake } = useApiAwake();
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
  const [handshakeStatus, setHandshakeStatus] = useState<HandshakeStatus>("WAITING");
  const hasShownReadyToastRef = useRef(false);

  useEffect(() => {
    const handleOpenCart = () => setIsCartOpen(true);
    window.addEventListener(APP_EVENTS.OPEN_CART, handleOpenCart);
    return () => window.removeEventListener(APP_EVENTS.OPEN_CART, handleOpenCart);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen, setIsUserMenuOpen]);

  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setAuthRedirectPending(true);
      await register(values);
      navigate("/");
      setAuthRedirectPending(false);
    } catch {
      setAuthRedirectPending(false);
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
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.warn("No se pudo cerrar sesión.", error);
    }
  };

  const handleOpenList = (list: ListDetail) => {
    const shoppingListState = adaptListToShoppingListState(list);

    setItems(shoppingListState.items);
    setCurrentListId(shoppingListState.listId);
    setCurrentListStatus(shoppingListState.listStatus);
    setCurrentListTitle(shoppingListState.listTitle);
    setIsListLoading(false);
    setCurrentListIsEditing(shoppingListState.isEditing);
    setIsCartOpen(true);
  };

  const handleStartOpenList = (list: ListSummary) => {
    setCurrentListId(list.id);
    setCurrentListStatus(adaptListStatusToShoppingListStatus(list.status));
    setCurrentListTitle(list.title);
    setIsListLoading(true);
    setCurrentListIsEditing(list.isEditing);
    setIsCartOpen(true);
  };

  const { authMode, currentPath, navigate, mainContent } = useAppShellNavigation({
    authUser,
    authRedirectPending,
    isAuthSubmitting,
    authError,
    isCategoriesOpen,
    openMobileCategoriesRequestKey,
    linesCount,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onOpenList: handleOpenList,
    onStartOpenList: handleStartOpenList,
  });

  useEffect(() => {
    if (!authUser) {
      setHandshakeStatus("READY");
      return;
    }

    setHandshakeStatus(apiAwake ? "READY" : "WAITING");
  }, [apiAwake, authUser]);

  useEffect(() => {
    if (handshakeStatus !== "READY" || !authUser) {
      hasShownReadyToastRef.current = false;
      return;
    }

    if (!hasShownReadyToastRef.current) {
      showToast({
        message: UI_TEXT.APP.HANDSHAKE_READY_TOAST,
        productName: "",
        thumbnail: null,
      });
      hasShownReadyToastRef.current = true;
    }
  }, [authUser, handshakeStatus, showToast]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        isCategoriesOpen={isCategoriesOpen}
        linesCount={linesCount}
        onNavigateHome={() => navigate("/")}
        onOpenCart={() => setIsCartOpen(true)}
        onToggleCategories={() => {
          if (isMobileCatalogInteractionMode()) {
            setIsCategoriesOpen(true);
            setOpenMobileCategoriesRequestKey((prev) => prev + 1);
            return;
          }

          setIsCategoriesOpen((prev) => !prev);
        }}
        onNavigateDownloadApp={() => navigate("/app")}
        onNavigateLogin={() => navigate("/auth/login")}
        onNavigateRegister={() => navigate("/auth/register")}
        onToggleUserMenu={() => setIsUserMenuOpen(!isUserMenuOpen)}
        onNavigateLists={() => navigate("/lists")}
        onCloseUserMenu={() => setIsUserMenuOpen(false)}
        onLogout={handleLogout}
        userMenuRef={userMenuRef}
      />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {handshakeStatus === "WAITING" ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {UI_TEXT.APP.HANDSHAKE_WAITING_BANNER}
          </div>
        ) : null}
        <div key={`${currentPath}-${authMode ?? "main"}`} className="page-transition" data-testid="page-transition">
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
          if (currentPath !== CATALOG_PATH) navigate(CATALOG_PATH);
        }}
        initialListId={currentListId}
        initialListStatus={currentListStatus}
        initialListTitle={currentListTitle}
        initialIsEditing={currentListIsEditing}
        isLoading={isListLoading}
        mutationsEnabled={handshakeStatus === "READY"}
      />
      <Toast />
    </div>
  );
};
