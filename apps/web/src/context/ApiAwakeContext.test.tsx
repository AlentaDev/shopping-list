// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ApiAwakeProvider, useApiAwake } from "./ApiAwakeContext";

function ApiAwakeState() {
  const { apiAwake } = useApiAwake();

  return <div data-testid="api-awake">{String(apiAwake)}</div>;
}

describe("ApiAwakeProvider", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("expone apiAwake=true cuando /health responde ok", async () => {
    vi.useRealTimers();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);

    render(
      <ApiAwakeProvider>
        <ApiAwakeState />
      </ApiAwakeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("api-awake")).toHaveTextContent("true");
    });
  });

  it("acota reintentos cuando /health falla siempre", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));

    render(
      <ApiAwakeProvider>
        <ApiAwakeState />
      </ApiAwakeProvider>,
    );

    await vi.runAllTimersAsync();

    expect(fetch).toHaveBeenCalledTimes(5);
    expect(screen.getByTestId("api-awake")).toHaveTextContent("false");
  });
});
