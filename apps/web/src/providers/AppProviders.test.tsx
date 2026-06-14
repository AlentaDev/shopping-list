// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useApiAwake } from "@src/context/ApiAwakeContext";
import { useAuth } from "@src/context/useAuth";
import { useList } from "@src/context/useList";
import { getCurrentUser } from "@src/features/auth/services/AuthService";
import { AppProviders } from "./AppProviders";

vi.mock("@src/features/auth/services/AuthService", async () => {
  const actual = await vi.importActual<
    typeof import("@src/features/auth/services/AuthService")
  >("@src/features/auth/services/AuthService");

  return {
    ...actual,
    getCurrentUser: vi.fn(),
  };
});

function createDeferredResponse() {
  let resolve!: (value: Response) => void;

  const promise = new Promise<Response>((promiseResolve) => {
    resolve = promiseResolve;
  });

  return { promise, resolve };
}

function ProvidersProbe() {
  const { apiAwake } = useApiAwake();
  const { authUser } = useAuth();
  const { draftProviderId, linesCount } = useList();

  return (
    <>
      <div data-testid="api-awake">{String(apiAwake)}</div>
      <div data-testid="auth-user">{authUser?.email ?? "anonymous"}</div>
      <div data-testid="draft-provider">{draftProviderId}</div>
      <div data-testid="lines-count">{String(linesCount)}</div>
    </>
  );
}

describe("AppProviders", () => {
  beforeEach(() => {
    vi.useRealTimers();
    vi.stubGlobal("fetch", vi.fn());
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it("renders children", () => {
    vi.mocked(fetch).mockReturnValue(createDeferredResponse().promise);

    render(
      <AppProviders>
        <span>Child content</span>
      </AppProviders>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("keeps ApiAwakeProvider ahead of AuthProvider and exposes descendant auth/list consumers", async () => {
    const healthCheck = createDeferredResponse();
    const fetchMock = vi.mocked(fetch);

    vi.useFakeTimers();
    fetchMock.mockReturnValueOnce(healthCheck.promise);
    vi.mocked(getCurrentUser).mockResolvedValue({
      id: "user-1",
      name: "Ada",
      email: "ada@example.com",
      postalCode: "28001",
    });

    render(
      <AppProviders>
        <ProvidersProbe />
      </AppProviders>,
    );

    expect(fetchMock).toHaveBeenCalledWith("/health");
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(screen.getByTestId("api-awake")).toHaveTextContent("false");
    expect(screen.getByTestId("auth-user")).toHaveTextContent("anonymous");
    expect(screen.getByTestId("draft-provider")).toHaveTextContent("mercadona");
    expect(screen.getByTestId("lines-count")).toHaveTextContent("0");

    await vi.advanceTimersByTimeAsync(0);

    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(screen.getByTestId("api-awake")).toHaveTextContent("false");

    vi.useRealTimers();

    healthCheck.resolve({ ok: true } as Response);

    await waitFor(() => {
      expect(screen.getByTestId("api-awake")).toHaveTextContent("true");
    });

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByTestId("auth-user")).toHaveTextContent(
        "ada@example.com",
      );
    });

    expect(fetchMock.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(getCurrentUser).mock.invocationCallOrder[0] ?? Number.POSITIVE_INFINITY,
    );
  });
});
