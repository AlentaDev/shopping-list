// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";
import { UI_TEXT } from "@src/shared/constants/ui";

// Mock auth service
vi.mock("@src/features/auth/services/AuthService", async () => {
  const actual = await vi.importActual<
    typeof import("@src/features/auth/services/AuthService")
  >("@src/features/auth/services/AuthService");
  return {
    ...actual,
    getCurrentUser: vi.fn(),
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    logoutUser: vi.fn(),
    refreshSession: vi.fn(),
  };
});

import {
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  AuthServiceError,
} from "@src/features/auth/services/AuthService";

type AuthSyncEvent = {
  type: "login" | "register" | "logout";
  timestamp: number;
  sourceTabId: string;
};

class BroadcastChannelMock {
  static readonly instances: BroadcastChannelMock[] = [];

  name: string;
  messages: AuthSyncEvent[] = [];
  onmessage: ((event: MessageEvent<AuthSyncEvent>) => void) | null = null;
  private listeners = new Set<(event: MessageEvent<AuthSyncEvent>) => void>();
  close = vi.fn();

  constructor(name: string) {
    this.name = name;
    BroadcastChannelMock.instances.push(this);
  }

  postMessage(message: AuthSyncEvent) {
    this.messages.push(message);

    for (const instance of BroadcastChannelMock.instances) {
      if (instance === this || instance.name !== this.name) {
        continue;
      }

      instance.emitMessage(message);
    }
  }

  addEventListener(
    eventName: "message",
    listener: (event: MessageEvent<AuthSyncEvent>) => void,
  ) {
    if (eventName === "message") {
      this.listeners.add(listener);
    }
  }

  emitMessage(message: AuthSyncEvent) {
    const event = { data: message } as MessageEvent<AuthSyncEvent>;
    this.onmessage?.(event);
    this.listeners.forEach((listener) => listener(event));
  }

  static reset() {
    BroadcastChannelMock.instances.length = 0;
  }
}

function AuthState({ testId }: { testId: string }) {
  const { authUser } = useAuth();

  return <div data-testid={testId}>{authUser ? authUser.email : "No user"}</div>;
}

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "password"; // nosem
const TEST_POSTAL_CODE = "28001";
const TEST_NAME = "Test";
// Component para testear AuthProvider
function TestComponent() {
  const {
    authUser,
    isAuthSubmitting,
    authError,
    isUserMenuOpen,
    setIsUserMenuOpen,
    register,
    login,
    logout,
  } = useAuth();

  return (
    <div>
      <div data-testid="authUser">{authUser ? authUser.email : "No user"}</div>
      <div data-testid="isAuthSubmitting">
        {isAuthSubmitting ? "true" : "false"}
      </div>
      <div data-testid="authError">{authError || "No error"}</div>
      <div data-testid="isUserMenuOpen">
        {isUserMenuOpen ? "true" : "false"}
      </div>
      <button onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
        Toggle Menu
      </button>
      <button
        onClick={() =>
          register({
            name: TEST_NAME,
            email: TEST_EMAIL,
            password: TEST_PASSWORD,
            postalCode: TEST_POSTAL_CODE,
          }).catch(() => {})
        }
      >
        Register
      </button>
      <button
        onClick={() =>
          login({ email: TEST_EMAIL, password: TEST_PASSWORD }).catch(() => {})
        }
      >
        Login
      </button>
      <button onClick={() => logout().catch(() => {})}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  const originalBroadcastChannel = globalThis.BroadcastChannel;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error("No refresh"));
    BroadcastChannelMock.reset();
    globalThis.BroadcastChannel = BroadcastChannelMock as never;
  });

  afterEach(() => {
    vi.resetAllMocks();
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  it("throws error when useAuth is used without AuthProvider", () => {
    // Create component that uses useAuth without provider
    function InvalidComponent() {
      useAuth();
      return null;
    }

    // Mock console.error to avoid polluting test output
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      render(<InvalidComponent />);
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleError.mockRestore();
  });

  it("loads current user on mount", async () => {
    const mockUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(
        "test@example.com",
      );
    });
    expect(getCurrentUser).toHaveBeenCalled();
  });


  it("deduplica el sync inicial en StrictMode para evitar llamadas duplicadas", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(
      new AuthServiceError("not_authenticated"),
    );

    render(
      <StrictMode>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </StrictMode>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent("No user");
    });

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("no reintenta refresh manual cuando current user devuelve not_authenticated", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(
      new AuthServiceError("not_authenticated"),
    );

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent("No user");
    });

    expect(getCurrentUser).toHaveBeenCalledTimes(1);
    expect(refreshSession).not.toHaveBeenCalled();
  });

  it("handles register and authenticates user", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    const mockUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    vi.mocked(registerUser).mockResolvedValueOnce(mockUser);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const registerButton = screen.getByRole("button", { name: "Register" });
    await user.click(registerButton);

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalled();
      expect(screen.getByTestId("authUser")).toHaveTextContent(
        "test@example.com",
      );
    });
  });

  it("shows a descriptive error when register fails with duplicate email", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    vi.mocked(registerUser).mockRejectedValueOnce(
      new AuthServiceError("duplicate_email", true),
    );

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const registerButton = screen.getByRole("button", { name: "Register" });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByTestId("authError")).toHaveTextContent(
        UI_TEXT.AUTH.ERRORS.DUPLICATE_EMAIL,
      );
    });
  });


  it("muestra mensaje de red cuando el servicio devuelve network_error visible", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    vi.mocked(loginUser).mockRejectedValueOnce(
      new AuthServiceError("network_error", true),
    );

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("authError")).toHaveTextContent(
        UI_TEXT.AUTH.ERRORS.NETWORK_ERROR,
      );
    });
  });

  it("no expone mensajes internos cuando el error no es visible para usuario", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    vi.mocked(loginUser).mockRejectedValueOnce(
      new AuthServiceError("received_401_without_retry", false),
    );

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("authError")).toHaveTextContent(
        UI_TEXT.AUTH.ERROR_MESSAGE,
      );
    });
  });

  it("handles login", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    const mockUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    vi.mocked(loginUser).mockResolvedValueOnce(mockUser);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const loginButton = screen.getByRole("button", { name: "Login" });
    await user.click(loginButton);

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalled();
      expect(screen.getByTestId("authUser")).toHaveTextContent(
        "test@example.com",
      );
    });
  });

  it("handles logout", async () => {
    const mockUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    vi.mocked(getCurrentUser).mockResolvedValueOnce(mockUser);
    vi.mocked(logoutUser).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(
        "test@example.com",
      );
    });

    const logoutButton = screen.getByRole("button", { name: "Logout" });
    await user.click(logoutButton);

    await waitFor(() => {
      expect(logoutUser).toHaveBeenCalled();
      expect(screen.getByTestId("authUser")).toHaveTextContent("No user");
      expect(screen.getByTestId("isUserMenuOpen")).toHaveTextContent("false");
    });
  });

  it("toggles user menu", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    const toggleButton = screen.getByRole("button", { name: "Toggle Menu" });

    expect(screen.getByTestId("isUserMenuOpen")).toHaveTextContent("false");

    await user.click(toggleButton);
    expect(screen.getByTestId("isUserMenuOpen")).toHaveTextContent("true");

    await user.click(toggleButton);
    expect(screen.getByTestId("isUserMenuOpen")).toHaveTextContent("false");
  });

  it("publishes auth sync events on login, register and logout", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    const mockUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    vi.mocked(registerUser).mockResolvedValueOnce(mockUser);
    vi.mocked(loginUser).mockResolvedValueOnce(mockUser);
    vi.mocked(logoutUser).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Register" }));
    await user.click(screen.getAllByRole("button", { name: "Login" })[0]);
    await user.click(screen.getAllByRole("button", { name: "Logout" })[0]);

    const publisherChannels = BroadcastChannelMock.instances.filter(
      (instance) => instance.messages.length > 0,
    );

    expect(publisherChannels).toHaveLength(3);
    expect(publisherChannels.map((instance) => instance.messages[0].type)).toEqual(
      ["register", "login", "logout"],
    );
    for (const instance of publisherChannels) {
      expect(instance.messages[0].timestamp).toEqual(expect.any(Number));
      expect(instance.messages[0].sourceTabId).toEqual(expect.any(String));
    }
  });

  it("updates auth state when receives sync events from another tab", async () => {
    const initialUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    const updatedUser = {
      ...initialUser,
      email: "updated@example.com",
    };

    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce(initialUser)
      .mockResolvedValueOnce(updatedUser)
      .mockRejectedValueOnce(new Error("No authenticated user"));
    vi.mocked(refreshSession).mockRejectedValue(
      new AuthServiceError("not_authenticated"),
    );

    const user = userEvent.setup();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(TEST_EMAIL);
    });

    await user.click(screen.getByRole("button", { name: "Toggle Menu" }));
    expect(screen.getByTestId("isUserMenuOpen")).toHaveTextContent("true");

    const subscriberChannel = BroadcastChannelMock.instances[0];

    act(() => {
      subscriberChannel.emitMessage({
        type: "login",
        timestamp: Date.now(),
        sourceTabId: "other-tab",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(
        "updated@example.com",
      );
    });

    act(() => {
      subscriberChannel.emitMessage({
        type: "logout",
        timestamp: Date.now(),
        sourceTabId: "other-tab",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent("No user");
      expect(screen.getByTestId("isUserMenuOpen")).toHaveTextContent("false");
      expect(getCurrentUser).toHaveBeenCalledTimes(2);
    });
  });

  it("uses localStorage fallback when BroadcastChannel is unavailable", async () => {
    globalThis.BroadcastChannel = undefined as never;
    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce({
        id: "1",
        name: TEST_NAME,
        email: TEST_EMAIL,
        postalCode: TEST_POSTAL_CODE,
      })
      .mockResolvedValueOnce({
        id: "1",
        name: TEST_NAME,
        email: "fallback@example.com",
        postalCode: TEST_POSTAL_CODE,
      });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(TEST_EMAIL);
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "auth.tabSync",
          newValue: JSON.stringify({
            type: "login",
            timestamp: Date.now(),
            sourceTabId: "other-tab",
          }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(
        "fallback@example.com",
      );
    });
  });

  it("ignora eventos de storage de autosave para sincronización de auth", async () => {
    globalThis.BroadcastChannel = undefined as never;
    vi.mocked(getCurrentUser).mockResolvedValueOnce({
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(TEST_EMAIL);
    });

    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "lists.localDraft",
          newValue: JSON.stringify({ title: "Lista", items: [] }),
        }),
      );
    });

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });
  });

  it("sincroniza login entre pestañas y actualiza authUser en la pestaña secundaria", async () => {
    const tabAUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    const tabBUser = {
      ...tabAUser,
      email: "tab-b@example.com",
    };

    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce(tabAUser)
      .mockRejectedValueOnce(new Error("No authenticated user"))
      .mockResolvedValueOnce(tabBUser);
    vi.mocked(refreshSession).mockRejectedValue(new Error("No refresh"));
    vi.mocked(loginUser).mockResolvedValueOnce(tabAUser);

    const user = userEvent.setup();

    render(
      <>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
        <AuthProvider>
          <AuthState testId="tab-b-auth-user" />
        </AuthProvider>
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(TEST_EMAIL);
      expect(screen.getByTestId("tab-b-auth-user")).toHaveTextContent(
        "No user",
      );
    });

    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByTestId("tab-b-auth-user")).toHaveTextContent(
        "tab-b@example.com",
      );
    });
  });

  it("sincroniza logout entre pestañas y limpia authUser en la pestaña secundaria", async () => {
    const initialUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };

    vi.mocked(getCurrentUser)
      .mockResolvedValueOnce(initialUser)
      .mockResolvedValueOnce(initialUser);
    vi.mocked(logoutUser).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();

    render(
      <>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
        <AuthProvider>
          <AuthState testId="tab-b-auth-user" />
        </AuthProvider>
      </>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent(TEST_EMAIL);
      expect(screen.getByTestId("tab-b-auth-user")).toHaveTextContent(
        TEST_EMAIL,
      );
    });

    await user.click(screen.getByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(screen.getByTestId("authUser")).toHaveTextContent("No user");
      expect(screen.getByTestId("tab-b-auth-user")).toHaveTextContent(
        "No user",
      );
    });
  });
});
