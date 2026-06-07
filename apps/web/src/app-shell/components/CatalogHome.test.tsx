// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CatalogHome } from "./CatalogHome";

describe("CatalogHome", () => {
  it("renders explicit provider entry actions", async () => {
    const user = userEvent.setup();
    const onSelectProvider = vi.fn();

    render(<CatalogHome onSelectProvider={onSelectProvider} />);

    await user.click(screen.getByRole("button", { name: "Entrar en Mercadona" }));

    expect(
      screen.getByRole("button", { name: "Entrar en Bonpreu Esclat" }),
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
