/* eslint-disable sonarjs/no-hardcoded-passwords */
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";
import { UI_TEXT } from "../../../shared/constants/ui";

describe("LoginForm", () => {
  it("submits credentials", async () => {
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(UI_TEXT.auth.LOGIN_EMAIL_LABEL),
      "ana@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.auth.LOGIN_PASSWORD_LABEL),
      "secret123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.auth.LOGIN_SUBMIT_LABEL })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      email: "ana@example.com",
      password: "secret123",
    });
  });

  it("shows an error message when provided", () => {
    render(
      <LoginForm
        onSubmit={vi.fn()}
        errorMessage={UI_TEXT.auth.LOGIN_ERROR_MESSAGE}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      UI_TEXT.auth.LOGIN_ERROR_MESSAGE
    );
  });
});
