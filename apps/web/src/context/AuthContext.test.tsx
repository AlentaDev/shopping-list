// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

vi.mock("@src/features/shopping-list/services/LocalDraftSyncService", () => ({
  syncLocalDraftToRemoteList: vi.fn(),
}));

import {
  getCurrentUser,
  registerUser,
  loginUser,
  logoutUser,
  refreshSession,
  AuthServiceError,
} from "@src/features/auth/services/AuthService";
import { syncLocalDraftToRemoteList } from "@src/features/shopping-list/services/LocalDraftSyncService";
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
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(refreshSession).mockRejectedValue(new Error("No refresh"));
  });

  afterEach(() => {
    vi.resetAllMocks();
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
    expect(syncLocalDraftToRemoteList).not.toHaveBeenCalled();
  });

  it("refreshes session and retries current user when initial load fails", async () => {
    const mockUser = {
      id: "1",
      name: TEST_NAME,
      email: TEST_EMAIL,
      postalCode: TEST_POSTAL_CODE,
    };
    vi.mocked(getCurrentUser)
      .mockRejectedValueOnce(new Error("Not logged in"))
      .mockResolvedValueOnce(mockUser);
    vi.mocked(refreshSession).mockResolvedValueOnce({ ok: true });

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

    expect(getCurrentUser).toHaveBeenCalledTimes(2);
    expect(refreshSession).toHaveBeenCalled();
    expect(syncLocalDraftToRemoteList).not.toHaveBeenCalled();
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
    expect(syncLocalDraftToRemoteList).toHaveBeenCalled();
  });

  it("shows a descriptive error when register fails with duplicate email", async () => {
    vi.mocked(getCurrentUser).mockRejectedValueOnce(new Error("Not logged in"));
    vi.mocked(registerUser).mockRejectedValueOnce(
      new AuthServiceError("duplicate_email"),
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
    expect(syncLocalDraftToRemoteList).toHaveBeenCalled();
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
});
