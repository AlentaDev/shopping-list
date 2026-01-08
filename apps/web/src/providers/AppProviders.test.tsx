// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppProviders } from "./AppProviders";

describe("AppProviders", () => {
  it("renders children", () => {
    render(
      <AppProviders>
        <span>Child content</span>
      </AppProviders>
    );

    expect(screen.getByText("Child content")).toBeInTheDocument();
  });
});
