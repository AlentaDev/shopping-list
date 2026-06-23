// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { AppFooter } from "./AppFooter";

describe("app-shell/AppFooter", () => {
  it("renders the landing footer copy left-aligned with indented supporting lines", () => {
    render(<AppFooter />);

    expect(screen.getByText(UI_TEXT.FOOTER.TAGLINE)).toBeInTheDocument();
    expect(screen.getByText(UI_TEXT.FOOTER.SUPPORTING_COPY)).toHaveClass("pl-4");
    expect(screen.getByText(UI_TEXT.FOOTER.COPYRIGHT)).toHaveClass("pl-4");
    expect(screen.getByTestId("app-footer-content")).toHaveClass("mx-auto", "max-w-7xl", "text-left");
    expect(screen.getByTestId("app-footer-content").className).not.toContain("text-center");
    expect(
      screen.queryByRole("link", { name: /descargar app android/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the content footer variant left-aligned for in-page layouts", () => {
    render(<AppFooter contentLayout="default" />);

    expect(screen.getByTestId("app-footer")).toHaveClass("w-full");
    expect(screen.getByTestId("app-footer-region")).toHaveClass("border-t", "bg-white");
    expect(screen.getByTestId("app-footer-content")).toHaveClass(
      "mx-auto",
      "max-w-7xl",
      "w-full",
      "text-left",
    );
    expect(screen.getByTestId("app-footer-content").className).not.toContain("text-center");
  });

  it("renders the catalog content footer with only the desktop region offset", () => {
    render(<AppFooter contentLayout="catalog" />);

    expect(screen.getByTestId("app-footer-shell")).toHaveClass("mx-auto", "max-w-7xl", "w-full");
    expect(screen.getByTestId("app-footer-region")).toHaveClass("md:ml-85");
    expect(screen.getByTestId("app-footer-region")).not.toHaveClass("border-t", "bg-white");
    expect(screen.getByTestId("app-footer-catalog-column")).toHaveClass(
      "border-t",
      "border-slate-200",
      "bg-white",
    );
    expect(screen.getByTestId("app-footer-content")).toHaveClass("w-full", "text-left");
    expect(screen.getByTestId("app-footer-content").className).not.toContain("max-w-7xl");
    expect(screen.getByTestId("app-footer-catalog-layout")).toHaveClass(
      "md:flex",
      "md:items-start",
    );
    expect(screen.queryByTestId("app-footer-catalog-spacer")).not.toBeInTheDocument();
  });
});
