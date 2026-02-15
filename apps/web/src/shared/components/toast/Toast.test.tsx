// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { ToastProvider } from "@src/context/ToastContext";
import { useToast } from "@src/context/useToast";
import Toast from "./Toast";

const TOAST_MESSAGE = "Producto añadido";
const PRODUCT_NAME = "Uvas blancas";
const PRODUCT_IMAGE = "https://example.com/uva.jpg";
const SECOND_PRODUCT_NAME = "Fresas";

const TriggerToast = () => {
  const { showToast } = useToast();

  useEffect(() => {
    showToast({
      message: TOAST_MESSAGE,
      productName: PRODUCT_NAME,
      thumbnail: PRODUCT_IMAGE,
    });
    showToast({
      message: TOAST_MESSAGE,
      productName: SECOND_PRODUCT_NAME,
      thumbnail: null,
    });
  }, [showToast]);

  return null;
};

describe("Toast", () => {
  it("renders the product photo and message", () => {
    render(
      <ToastProvider>
        <TriggerToast />
        <Toast />
      </ToastProvider>,
    );

    expect(screen.getAllByText(TOAST_MESSAGE)).toHaveLength(2);
    expect(screen.getByText(PRODUCT_NAME)).toBeInTheDocument();
    expect(screen.getByText(SECOND_PRODUCT_NAME)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: PRODUCT_NAME })).toHaveAttribute(
      "src",
      PRODUCT_IMAGE,
    );
    expect(screen.getByTestId("toast-fallback-icon")).toBeInTheDocument();
    expect(screen.getByTestId("toast-fallback-icon")).toHaveClass(
      "text-emerald-500",
    );
    expect(screen.getByTestId("toast-stack")).toHaveClass("flex-col-reverse");
  });
});
