// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import App from "@src/App";

vi.mock("@src/features/app-shell/AppShell", () => ({
  AppShell: () => <div>AppShell mocked</div>,
}));

describe("App", () => {
  it("renders the app shell container", () => {
    render(<App />);

    expect(screen.getByText("AppShell mocked")).toBeInTheDocument();
  });
});
