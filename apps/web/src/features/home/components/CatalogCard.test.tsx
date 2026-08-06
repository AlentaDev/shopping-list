// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { CatalogCard } from "./CatalogCard";

describe("features/home/CatalogCard", () => {
  it("renders a fuller centered provider card with a dedicated CTA", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <CatalogCard
        providerId="mercadona"
        logoSrc="/images/providers/mercadona/card.png"
        logoAlt={UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT}
        ctaLabel={UI_TEXT.HOME.PROVIDERS.MERCADONA.CTA_LABEL}
        onSelect={onSelect}
      />,
    );

    const logo = screen.getByRole("img", {
      name: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT,
    });
    const card = logo.closest("article");

    expect(logo).toHaveAttribute("src", "/images/providers/mercadona/card.png");
    expect(card).toHaveClass(
      "flex",
      "flex-col",
      "items-center",
      "justify-center",
      "min-h-[20rem]",
    );
    expect(logo.parentElement).toHaveClass("min-h-40");
    expect(logo).toHaveClass("max-h-32");

    await user.click(
      within(card as HTMLElement).getByRole("button", {
        name: UI_TEXT.HOME.PROVIDERS.MERCADONA.CTA_LABEL,
      }),
    );

    expect(onSelect).toHaveBeenCalledWith("mercadona");
  });
});
