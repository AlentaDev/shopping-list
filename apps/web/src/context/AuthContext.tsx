import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  AuthServiceError,
  type LoginInput,
  type RegisterInput,
  type AuthUser,
} from "@src/features/auth/services/AuthService";

export type AuthContextType = {
  authUser: AuthUser | null;
  isAuthSubmitting: boolean;
  authError: string | null;
  isUserMenuOpen: boolean;
  setIsUserMenuOpen: (isOpen: boolean) => void;
  register: (values: RegisterInput) => Promise<AuthUser>;
  login: (values: LoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

type AuthProviderProps = {
  children: ReactNode;
};

type AuthSyncEvent = {
  type: "login" | "register" | "logout";
  timestamp: number;
  sourceTabId: string;
};

const AUTH_TAB_SYNC_KEY = "auth.tabSync";

function createTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}`;
}


export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const sourceTabId = useMemo(() => createTabId(), []);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const syncAuthenticatedUser = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setAuthUser(user);
      return;
    } catch (error) {
      if (
        error instanceof AuthServiceError &&
        error.code === "not_authenticated"
      ) {
        setAuthUser(null);
        setIsUserMenuOpen(false);
        setAuthError(resolveAuthErrorMessage(error));
        return;
      }

      setAuthError(resolveAuthErrorMessage(error));
    }
  }, []);

  const publishAuthSyncEvent = useCallback(
    (type: AuthSyncEvent["type"]) => {
      const event: AuthSyncEvent = {
        type,
        timestamp: Date.now(),
        sourceTabId,
      };

      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("auth");
        channel.postMessage(event);
        channel.close();
        return;
      }

      localStorage.setItem(AUTH_TAB_SYNC_KEY, JSON.stringify(event));
    },
    [sourceTabId],
  );

  // Cargar usuario autenticado al montar
  useEffect(() => {
    let isActive = true;

    const runInitialSync = async () => {
      await syncAuthenticatedUser();
    };

    const onSyncEvent = (event: AuthSyncEvent) => {
      if (!isActive || event.sourceTabId === sourceTabId) {
        return;
      }

      if (event.type === "logout") {
        setAuthUser(null);
        setIsUserMenuOpen(false);
        return;
      }

      void syncAuthenticatedUser();
    };

    const onStorage = (storageEvent: StorageEvent) => {
      if (storageEvent.key !== AUTH_TAB_SYNC_KEY || !storageEvent.newValue) {
        return;
      }

      const parsedEvent = JSON.parse(storageEvent.newValue) as AuthSyncEvent;
      onSyncEvent(parsedEvent);
    };

    let channel: BroadcastChannel | null = null;

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("auth");
      channel.addEventListener("message", (messageEvent) => {
        onSyncEvent(messageEvent.data as AuthSyncEvent);
      });
    } else {
      window.addEventListener("storage", onStorage);
    }

    const initialSyncTimeoutId = window.setTimeout(() => {
      void runInitialSync();
    }, 0);

    return () => {
      isActive = false;
      window.clearTimeout(initialSyncTimeoutId);
      channel?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, [sourceTabId, syncAuthenticatedUser]);

  const register = useCallback(async (values: RegisterInput) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const user = await registerUser(values);
      setAuthUser(user);
      publishAuthSyncEvent("register");
      return user;
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
      throw error;
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [publishAuthSyncEvent]);

  const login = useCallback(async (values: LoginInput) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const user = await loginUser(values);
      setAuthUser(user);
      publishAuthSyncEvent("login");
      return user;
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
      throw error;
    } finally {
      setIsAuthSubmitting(false);
    }
  }, [publishAuthSyncEvent]);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      setIsUserMenuOpen(false);
      publishAuthSyncEvent("logout");
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
      throw error;
    }
  }, [publishAuthSyncEvent]);

  const value: AuthContextType & {
    register: typeof register;
    login: typeof login;
    logout: typeof logout;
  } = {
    authUser,
    isAuthSubmitting,
    authError,
    isUserMenuOpen,
    setIsUserMenuOpen,
    register,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value as AuthContextType}>
      {children}
    </AuthContext.Provider>
  );
}

function resolveAuthErrorMessage(error: unknown): string {
  if (error instanceof AuthServiceError) {
    const errorMessages: Record<string, string> = {
      duplicate_email: UI_TEXT.AUTH.ERRORS.DUPLICATE_EMAIL,
      invalid_credentials: UI_TEXT.AUTH.ERRORS.INVALID_CREDENTIALS,
      validation_error: UI_TEXT.AUTH.ERRORS.VALIDATION_ERROR,
      not_authenticated: UI_TEXT.AUTH.ERRORS.NOT_AUTHENTICATED,
      internal_server_error: UI_TEXT.AUTH.ERRORS.SERVER_ERROR,
    };

    return errorMessages[error.code] ?? UI_TEXT.AUTH.ERROR_MESSAGE;
  }

  return UI_TEXT.AUTH.ERROR_MESSAGE;
}
