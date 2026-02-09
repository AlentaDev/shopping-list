import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
  refreshSession,
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

export function AuthProvider({ children }: AuthProviderProps) {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Cargar usuario autenticado al montar
  useEffect(() => {
    let isActive = true;

    const applyAuthenticatedUser = async (user: AuthUser) => {
      if (!isActive) {
        return;
      }
      setAuthUser(user);
    };

    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        await applyAuthenticatedUser(user);
      } catch (error) {
        if (
          error instanceof AuthServiceError &&
          error.code === "not_authenticated" &&
          isActive
        ) {
          setAuthUser(null);
          setIsUserMenuOpen(false);
          setAuthError(resolveAuthErrorMessage(error));
          return;
        }
        try {
          await refreshSession();
          const refreshedUser = await getCurrentUser();
          await applyAuthenticatedUser(refreshedUser);
        } catch (refreshError) {
          if (
            refreshError instanceof AuthServiceError &&
            refreshError.code === "not_authenticated" &&
            isActive
          ) {
            setAuthUser(null);
            setIsUserMenuOpen(false);
            setAuthError(resolveAuthErrorMessage(refreshError));
          }
          // No-op: usuario no autenticado
        }
      }
    };

    void loadCurrentUser();

    return () => {
      isActive = false;
    };
  }, []);

  const register = useCallback(async (values: RegisterInput) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const user = await registerUser(values);
      setAuthUser(user);
      return user;
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
      throw error;
    } finally {
      setIsAuthSubmitting(false);
    }
  }, []);

  const login = useCallback(async (values: LoginInput) => {
    setAuthError(null);
    setIsAuthSubmitting(true);
    try {
      const user = await loginUser(values);
      setAuthUser(user);
      return user;
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
      throw error;
    } finally {
      setIsAuthSubmitting(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutUser();
      setAuthUser(null);
      setIsUserMenuOpen(false);
    } catch (error) {
      setAuthError(resolveAuthErrorMessage(error));
      throw error;
    }
  }, []);

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
