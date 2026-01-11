/* eslint-disable sonarjs/no-hardcoded-passwords */
// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm";
import { UI_TEXT } from "../../../shared/constants/ui";

describe("RegisterForm", () => {
  it("submits registration details", async () => {
    const onSubmit = vi.fn();

    render(<RegisterForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(UI_TEXT.auth.REGISTER_NAME_LABEL),
      "Ana"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.auth.REGISTER_EMAIL_LABEL),
      "ana@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.auth.REGISTER_PASSWORD_LABEL),
      "secret123"
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.auth.REGISTER_SUBMIT_LABEL })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@example.com",
      password: "secret123",
    });
  });

  it("shows an error message when provided", () => {
    render(
      <RegisterForm
        onSubmit={vi.fn()}
        errorMessage={UI_TEXT.auth.REGISTER_ERROR_MESSAGE}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      UI_TEXT.auth.REGISTER_ERROR_MESSAGE
    );
  });
});
