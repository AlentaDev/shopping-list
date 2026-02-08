// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";
import { AppHeader } from "@src/features/app-shell/components/AppHeader";

const baseProps = {
  authUser: null,
  isUserMenuOpen: false,
  isCategoriesOpen: false,
  linesCount: 0,
  onNavigateHome: vi.fn(),
  onOpenCart: vi.fn(),
  onToggleCategories: vi.fn(),
  onNavigateLogin: vi.fn(),
  onNavigateRegister: vi.fn(),
  onToggleUserMenu: vi.fn(),
  onNavigateLists: vi.fn(),
  onCloseUserMenu: vi.fn(),
  onLogout: vi.fn(),
  userMenuRef: createRef<HTMLDivElement>(),
};

describe("AppHeader", () => {
  it("muestra botones de login y registro cuando no hay usuario", () => {
    render(<AppHeader {...baseProps} />);

    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.LOGIN_LABEL }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.APP.REGISTER_LABEL }),
    ).toBeInTheDocument();
  });

  it("notifica el toggle de categorías", async () => {
    const onToggleCategories = vi.fn();

    render(
      <AppHeader
        {...baseProps}
        onToggleCategories={onToggleCategories}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.APP.CATEGORIES_LABEL }),
    );

    expect(onToggleCategories).toHaveBeenCalledTimes(1);
  });

  it("renderiza el menú de usuario y dispara acciones", async () => {
    const onToggleUserMenu = vi.fn();
    const onNavigateLists = vi.fn();
    const onCloseUserMenu = vi.fn();
    const onLogout = vi.fn();

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
        onToggleUserMenu={onToggleUserMenu}
        onNavigateLists={onNavigateLists}
        onCloseUserMenu={onCloseUserMenu}
        onLogout={onLogout}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.AUTH.USER_MENU.MENU_BUTTON_LABEL,
      }),
    );
    expect(onToggleUserMenu).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LISTS }),
    );
    expect(onNavigateLists).toHaveBeenCalledTimes(1);
    expect(onCloseUserMenu).toHaveBeenCalledTimes(1);

    await userEvent.click(
      screen.getByRole("menuitem", { name: UI_TEXT.AUTH.USER_MENU.LOGOUT }),
    );
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
