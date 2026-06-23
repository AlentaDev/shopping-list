// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { CatalogHome } from "./CatalogHome";

describe("features/home/CatalogHome", () => {
  it("renders the hero and provider cards from the home feature", () => {
    render(<CatalogHome onSelectProvider={vi.fn()} />);

    expect(
      screen.getByRole("heading", { name: UI_TEXT.HOME.HERO_TITLE }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: UI_TEXT.HOME.DOWNLOAD_APP_CTA_LABEL }),
    ).toHaveAttribute("href", "/app");
    expect(
      screen.getByRole("img", { name: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT }),
    ).toHaveAttribute("src", "/images/providers/mercadona/card.png");
    expect(
      screen.getByRole("img", { name: UI_TEXT.HOME.PROVIDERS.BONPREUESCLAT.LOGO_ALT }),
    ).toHaveAttribute("src", "/images/providers/bonpreuesclat/card.png");
  });

  it("keeps explicit provider entry actions", async () => {
    const user = userEvent.setup();
    const onSelectProvider = vi.fn();

    render(<CatalogHome onSelectProvider={onSelectProvider} />);

    const mercadonaCard = screen
      .getByRole("img", { name: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT })
      .closest("article");
    const bonpreuCard = screen
      .getByRole("img", { name: UI_TEXT.HOME.PROVIDERS.BONPREUESCLAT.LOGO_ALT })
      .closest("article");

    await user.click(
      within(mercadonaCard as HTMLElement).getByRole("button", {
        name: UI_TEXT.HOME.PROVIDERS.MERCADONA.CTA_LABEL,
      }),
    );

    expect(
      within(bonpreuCard as HTMLElement).getByRole("button", {
        name: UI_TEXT.HOME.PROVIDERS.BONPREUESCLAT.CTA_LABEL,
      }),
    ).toBeInTheDocument();
    expect(onSelectProvider).toHaveBeenCalledWith("mercadona");
  });

  it("shows anonymous draft guidance only when provider context exists", () => {
    const { rerender } = render(
      <CatalogHome
        draftProviderId="bonpreuesclat"
        showAnonymousDraftGuidance
        onSelectProvider={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Tienes un borrador asociado a Bonpreu Esclat/i),
    ).toBeInTheDocument();

    rerender(
      <CatalogHome
        draftProviderId="bonpreuesclat"
        showAnonymousDraftGuidance={false}
        onSelectProvider={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/Tienes un borrador asociado a Bonpreu Esclat/i),
    ).not.toBeInTheDocument();
  });
});
