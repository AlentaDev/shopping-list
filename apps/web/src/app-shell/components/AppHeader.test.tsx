// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import { AppHeader } from "./AppHeader";

const baseProps = {
  authUser: null,
  isUserMenuOpen: false,
  isCategoriesOpen: false,
  linesCount: 0,
  onNavigateHome: vi.fn(),
  onOpenCart: vi.fn(),
  onToggleCategories: vi.fn(),
  onNavigateDownloadApp: vi.fn(),
  onNavigateLogin: vi.fn(),
  onNavigateRegister: vi.fn(),
  onToggleUserMenu: vi.fn(),
  onNavigateLists: vi.fn(),
  onCloseUserMenu: vi.fn(),
  onLogout: vi.fn(),
  userMenuRef: createRef<HTMLDivElement>(),
};

describe("app-shell/AppHeader", () => {
  it("muestra login/registro cuando no hay usuario autenticado", () => {
    render(<AppHeader {...baseProps} />);

    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL }),
    ).toBeInTheDocument();
  });

  it("abre carrito cuando se hace click en el botón de carrito", async () => {
    const onOpenCart = vi.fn();
    render(<AppHeader {...baseProps} linesCount={2} onOpenCart={onOpenCart} />);

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.APP.CART_BUTTON_LABEL }),
    );

    expect(onOpenCart).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("en menú autenticado dispara logout y cierra menú", async () => {
    const onLogout = vi.fn();
    const onCloseUserMenu = vi.fn();

    render(
      <AppHeader
        {...baseProps}
        authUser={{
          id: "user-1",
          name: "Ada",
          email: "ada@example.com",
          postalCode: "28001",
        }}
        isUserMenuOpen
        onLogout={onLogout}
        onCloseUserMenu={onCloseUserMenu}
      />,
    );

    await userEvent.click(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT }),
    );

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onCloseUserMenu).toHaveBeenCalledTimes(1);
  });
});
