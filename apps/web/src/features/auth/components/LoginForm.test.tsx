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
});
