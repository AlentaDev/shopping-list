// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import AuthScreen from "./AuthScreen";

const baseProps = {
  isSubmitting: false,
  errorMessage: null,
  onLogin: vi.fn(),
  onRegister: vi.fn(),
  onBack: vi.fn(),
  onNavigateToLogin: vi.fn(),
  onNavigateToRegister: vi.fn(),
};

describe("AuthScreen", () => {
  it("renders the login card secondary navigation below the form", async () => {
    const onNavigateToRegister = vi.fn();

    render(
      <AuthScreen
        {...baseProps}
        mode="login"
        onNavigateToRegister={onNavigateToRegister}
      />,
    );

    expect(
      screen.getByText(UI_TEXT.AUTH.LOGIN.SECONDARY_PROMPT),
    ).toBeInTheDocument();

    const registerLink = screen.getByRole("button", {
      name: UI_TEXT.AUTH.LOGIN.SECONDARY_ACTION,
    });

    expect(registerLink).toHaveClass("text-blue-600", "underline");
    expect(registerLink).not.toHaveClass("border", "bg-white", "w-full");

    await userEvent.click(registerLink);

    expect(onNavigateToRegister).toHaveBeenCalledTimes(1);
  });

  it("renders the register card secondary navigation below the form", async () => {
    const onNavigateToLogin = vi.fn();

    render(
      <AuthScreen
        {...baseProps}
        mode="register"
        onNavigateToLogin={onNavigateToLogin}
      />,
    );

    expect(
      screen.getByText(UI_TEXT.AUTH.REGISTER.SECONDARY_PROMPT),
    ).toBeInTheDocument();

    const loginLink = screen.getByRole("button", {
      name: UI_TEXT.AUTH.REGISTER.SECONDARY_ACTION,
    });

    expect(loginLink).toHaveClass("text-blue-600", "underline");
    expect(loginLink).not.toHaveClass("border", "bg-white", "w-full");

    await userEvent.click(loginLink);

    expect(onNavigateToLogin).toHaveBeenCalledTimes(1);
  });
});
