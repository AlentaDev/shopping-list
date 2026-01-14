// @vitest-environment jsdom
/* eslint-disable sonarjs/no-hardcoded-passwords */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginForm from "./LoginForm";
import { UI_TEXT } from "../../../shared/constants/ui";

const TEST_PASSWORD = "Password12!A";

describe("LoginForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the login fields", () => {
    render(<LoginForm onSubmit={vi.fn()} />);

    expect(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.EMAIL_LABEL)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL)
    ).toBeInTheDocument();
  });

  it("disables browser autocomplete to avoid unexpected submissions", () => {
    const { container } = render(<LoginForm onSubmit={vi.fn()} />);

    const form = container.querySelector("form");
    expect(form).toHaveAttribute("autocomplete", "off");

    expect(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.EMAIL_LABEL)
    ).toHaveAttribute("autocomplete", "off");
    expect(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL)
    ).toHaveAttribute("autocomplete", "off");
  });

  it("submits the form values", async () => {
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.EMAIL_LABEL),
      "ada@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.LOGIN.PASSWORD_LABEL),
      TEST_PASSWORD
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.AUTH.LOGIN.SUBMIT_LABEL })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: TEST_PASSWORD,
    });
  });

  it("shows validation errors on blur and submit", async () => {
    const onSubmit = vi.fn();

    render(<LoginForm onSubmit={onSubmit} />);

    const emailInput = screen.getByLabelText(UI_TEXT.AUTH.LOGIN.EMAIL_LABEL);
    await userEvent.type(emailInput, "invalid-email");
    await userEvent.tab();

    expect(
      screen.getByText(UI_TEXT.AUTH.VALIDATION.EMAIL_INVALID)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.AUTH.LOGIN.SUBMIT_LABEL })
    );

    expect(
      screen.getByText(UI_TEXT.AUTH.VALIDATION.PASSWORD_REQUIRED)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
