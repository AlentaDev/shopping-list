// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { useList } from "./useList";
import { renderHook } from "@testing-library/react";

describe("useList", () => {
  it("throws error when used outside ListProvider", () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useList());
    }).toThrow("useList must be used within a ListProvider");

    spy.mockRestore();
  });
});
