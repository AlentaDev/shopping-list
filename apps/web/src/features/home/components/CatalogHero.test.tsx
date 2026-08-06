// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { CatalogHero } from "./CatalogHero";

describe("features/home/CatalogHero", () => {
  it("renders the landing hero with provider and app CTAs", () => {
    render(<CatalogHero />);

    expect(
      screen.getByRole("heading", { name: UI_TEXT.HOME.HERO_TITLE }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: UI_TEXT.HOME.PRIMARY_CTA_LABEL }),
    ).toHaveAttribute("href", "#providers");
    expect(
      screen.getByRole("link", { name: UI_TEXT.HOME.DOWNLOAD_APP_CTA_LABEL }),
    ).toHaveAttribute("href", "/app");
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("shows anonymous draft guidance only when provided", () => {
    const { rerender } = render(
      <CatalogHero
        draftGuidance="Tienes un borrador asociado a Bonpreu Esclat."
      />,
    );

    expect(
      screen.getByText("Tienes un borrador asociado a Bonpreu Esclat."),
    ).toBeInTheDocument();

    rerender(<CatalogHero />);

    expect(
      screen.queryByText("Tienes un borrador asociado a Bonpreu Esclat."),
    ).not.toBeInTheDocument();
  });
});
