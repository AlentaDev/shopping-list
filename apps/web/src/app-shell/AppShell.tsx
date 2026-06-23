import { useEffect, useState, useRef } from "react";
import {
  ShoppingList,
  adaptListStatusToShoppingListStatus,
  adaptListToShoppingListState,
  cancelListEditing,
  deleteAutosave,
  loadLocalDraft,
  saveLocalDraft,
} from "@src/features/shopping-list";
import { useList } from "@src/context/useList";
import { useAuth } from "@src/context/useAuth";
import { useToast } from "@src/context/useToast";
import { useApiAwake } from "@src/context/ApiAwakeContext";
import Toast from "@src/shared/components/toast/Toast";
import { UI_TEXT } from "@src/shared/constants/ui";
import { APP_EVENTS } from "@src/shared/constants/appState";
import { AppHeader } from "@src/app-shell/components/AppHeader";
import { AppFooter } from "@src/app-shell/components/AppFooter";
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
import { getProviderDisplayName } from "@src/shared/constants/providers";

const CATALOG_PATH = "/catalog";
const EDIT_SESSION_STORAGE_KEY = "lists.editSession";
type HandshakeStatus = "WAITING" | "READY";

type ActiveEditConflictState = {
  currentProviderId: string;
  requestedProviderId: string;
};

const loadEditSessionListId = (): string | null => {
  try {
    const stored = localStorage.getItem(EDIT_SESSION_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as {
      listId?: unknown;
      isEditing?: unknown;
    };

    return parsed.isEditing === true && typeof parsed.listId === "string"
      ? parsed.listId
      : null;
  } catch {
    return null;
  }
};

const clearEditSessionMarker = (): void => {
  localStorage.removeItem(EDIT_SESSION_STORAGE_KEY);
};

export const AppShell = () => {
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
  const { linesCount, setItems, resetDraft, setDraftProviderId } = useList();
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
  const [activeEditConflict, setActiveEditConflict] =
    useState<ActiveEditConflictState | null>(null);
  const hasShownReadyToastRef = useRef(false);
  const localDraft = loadLocalDraft();
  const homeDraftProviderId = !authUser ? (localDraft?.providerId ?? null) : null;
  const showAnonymousDraftGuidance = !authUser && Boolean(localDraft?.providerId);

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
    if (list.provider?.slug) {
      setDraftProviderId(list.provider.slug);
    }

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
    if (list.provider?.slug) {
      setDraftProviderId(list.provider.slug);
    }

    setCurrentListId(list.id);
    setCurrentListStatus(adaptListStatusToShoppingListStatus(list.status));
    setCurrentListTitle(list.title);
    setIsListLoading(true);
    setCurrentListIsEditing(list.isEditing);
    setIsCartOpen(true);
  };

  const handleSelectHomeProvider = (providerId: string) => {
    if (linesCount === 0) {
      resetDraft(providerId);
      saveLocalDraft({
        title: "",
        providerId,
        items: [],
      });
    }

    navigate(`/${providerId}/catalog`);
  };

  const handleRequestActiveEditConflict = ({
    currentProviderId,
    requestedProviderId,
  }: ActiveEditConflictState) => {
    setActiveEditConflict({ currentProviderId, requestedProviderId });
  };

  const handleDismissActiveEditConflict = () => {
    if (!activeEditConflict) {
      return;
    }

    navigate(`/${activeEditConflict.currentProviderId}/catalog`);
    setActiveEditConflict(null);
  };

  const handleCancelEditingAndStartNewList = async () => {
    if (!activeEditConflict) {
      return;
    }

    const editingListId = loadEditSessionListId();

    try {
      if (editingListId) {
        await cancelListEditing(editingListId);
      }

      await deleteAutosave();
      clearEditSessionMarker();
      resetDraft(activeEditConflict.requestedProviderId);
      setDraftProviderId(activeEditConflict.requestedProviderId);
      setItems([]);
      setCurrentListId(null);
      setCurrentListStatus(LIST_STATUS.LOCAL_DRAFT);
      setCurrentListTitle(UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE);
      setCurrentListIsEditing(false);
      setIsListLoading(false);
      setIsCartOpen(false);
      saveLocalDraft({
        title: "",
        providerId: activeEditConflict.requestedProviderId,
        items: [],
      });
      navigate(`/${activeEditConflict.requestedProviderId}/catalog`);
      setActiveEditConflict(null);
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : UI_TEXT.LISTS.ACTIVE_EDIT_CONFLICT.CANCEL_ERROR,
        productName: "",
      });
    }
  };

  const { currentPath, navigate, mainContent } = useAppShellNavigation({
    authUser,
    authRedirectPending,
    isAuthSubmitting,
    authError,
    linesCount,
    onLogin: handleLogin,
    onRegister: handleRegister,
    onOpenList: handleOpenList,
    onStartOpenList: handleStartOpenList,
    homeDraftProviderId,
    showAnonymousDraftGuidance,
    onSelectHomeProvider: handleSelectHomeProvider,
    onRequestActiveEditConflict: handleRequestActiveEditConflict,
  });
  const isLandingPage = currentPath === "/";
  const isCatalogRoute = /^\/[^/]+\/catalog(?:\/[^/]+)?$/.test(currentPath);
  const catalogProviderId = currentPath.match(/^\/([^/]+)\/catalog(?:\/[^/]+)?$/)?.[1] ?? null;
  const footerContentLayout = isCatalogRoute ? "catalog" : "default";

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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <AppHeader
        authUser={authUser}
        isUserMenuOpen={isUserMenuOpen}
        currentPath={currentPath}
        isCatalogRoute={isCatalogRoute}
        catalogProviderId={catalogProviderId}
        linesCount={linesCount}
        onNavigateHome={() => navigate("/")}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigateDownloadApp={() => navigate("/app")}
        onNavigateLogin={() => navigate("/auth/login")}
        onNavigateRegister={() => navigate("/auth/register")}
        onToggleUserMenu={() => setIsUserMenuOpen(!isUserMenuOpen)}
        onNavigateLists={() => navigate("/lists")}
        onCloseUserMenu={() => setIsUserMenuOpen(false)}
        onLogout={handleLogout}
        userMenuRef={userMenuRef}
      />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {handshakeStatus === "WAITING" ? (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {UI_TEXT.APP.HANDSHAKE_WAITING_BANNER}
          </div>
        ) : null}
        <div className="page-transition" data-testid="page-transition">
          {mainContent}
        </div>
        {activeEditConflict ? (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 p-4">
            <div
              role="dialog"
              aria-modal="true"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            >
              <h2 className="text-lg font-semibold text-slate-900">
                {UI_TEXT.LISTS.ACTIVE_EDIT_CONFLICT.TITLE}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                {UI_TEXT.LISTS.ACTIVE_EDIT_CONFLICT.MESSAGE
                  .replace(
                    "{currentProvider}",
                    getProviderDisplayName(activeEditConflict.currentProviderId),
                  )
                  .replace(
                    "{requestedProvider}",
                    getProviderDisplayName(activeEditConflict.requestedProviderId),
                  )}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleDismissActiveEditConflict}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  {UI_TEXT.LISTS.ACTIVE_EDIT_CONFLICT.RETURN_LABEL}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleCancelEditingAndStartNewList();
                  }}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  {UI_TEXT.LISTS.ACTIVE_EDIT_CONFLICT.CONFIRM_LABEL}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
      <AppFooter contentLayout={footerContentLayout} />
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
