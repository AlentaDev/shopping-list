// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act, useEffect } from "react";
import { ToastProvider } from "./ToastContext";
import { useToast } from "./useToast";

const MESSAGE_TEST_ID = "toast-message";
const PRODUCT_TEST_ID = "toast-product";
const COUNT_TEST_ID = "toast-count";
const SUCCESS_MESSAGE = "Añadido a la lista";
const FIRST_PRODUCT_NAME = "Tomates";

const TestConsumer = () => {
  const { toasts, showToast, hideToast } = useToast();
  const firstToast = toasts[0];
  const lastToast = toasts[toasts.length - 1];

  return (
    <div>
      <span data-testid={MESSAGE_TEST_ID}>{lastToast?.message ?? ""}</span>
      <span data-testid={PRODUCT_TEST_ID}>{lastToast?.productName ?? ""}</span>
      <span data-testid={COUNT_TEST_ID}>{toasts.length}</span>
      <button
        type="button"
        onClick={() =>
          showToast({
            message: SUCCESS_MESSAGE,
            productName: FIRST_PRODUCT_NAME,
            thumbnail: null,
          })
        }
      >
        Show
      </button>
      <button
        type="button"
        onClick={() =>
          showToast({
            message: SUCCESS_MESSAGE,
            productName: "Aceite de oliva",
            thumbnail: null,
          })
        }
      >
        Show again
      </button>
      <button
        type="button"
        onClick={() => {
          if (firstToast) {
            hideToast(firstToast.id);
          }
        }}
      >
        Hide
      </button>
    </div>
  );
};

describe("ToastContext", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the latest toast details", async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByTestId(COUNT_TEST_ID)).toHaveTextContent("1");
    expect(screen.getByTestId(MESSAGE_TEST_ID)).toHaveTextContent(
      SUCCESS_MESSAGE
    );
    expect(screen.getByTestId(PRODUCT_TEST_ID)).toHaveTextContent(
      FIRST_PRODUCT_NAME
    );

    await userEvent.click(screen.getByRole("button", { name: "Show again" }));

    expect(screen.getByTestId(COUNT_TEST_ID)).toHaveTextContent("2");
    expect(screen.getByTestId(PRODUCT_TEST_ID)).toHaveTextContent(
      "Aceite de oliva"
    );
  });

  it("hides the toast when requested", async () => {
    render(
      <ToastProvider>
        <TestConsumer />
      </ToastProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Show" }));
    await userEvent.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.getByTestId(COUNT_TEST_ID)).toHaveTextContent("0");
    expect(screen.getByTestId(MESSAGE_TEST_ID)).toHaveTextContent("");
    expect(screen.getByTestId(PRODUCT_TEST_ID)).toHaveTextContent("");
  });

  it("auto hides after the timeout", async () => {
    vi.useFakeTimers();

    const AutoTrigger = () => {
      const { showToast } = useToast();

      useEffect(() => {
        showToast({
          message: SUCCESS_MESSAGE,
          productName: FIRST_PRODUCT_NAME,
          thumbnail: null,
        });
      }, [showToast]);

      return null;
    };

    render(
      <ToastProvider>
        <AutoTrigger />
        <TestConsumer />
      </ToastProvider>
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000);
    });

    expect(screen.getByTestId(COUNT_TEST_ID)).toHaveTextContent("0");
  });
});
