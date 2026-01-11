// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useToast } from "./useToast";

describe("useToast", () => {
  it("throws error when used outside ToastProvider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useToast());
    }).toThrow("useToast must be used within a ToastProvider");

    spy.mockRestore();
  });
});
