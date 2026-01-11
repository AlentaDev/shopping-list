// @vitest-environment jsdom
/* eslint-disable sonarjs/no-hardcoded-passwords */
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "./RegisterForm";
import { UI_TEXT } from "../../../shared/constants/ui";

const TEST_PASSWORD = "Password12!A";

describe("RegisterForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the registration fields", () => {
    render(<RegisterForm onSubmit={vi.fn()} />);

    expect(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.NAME_LABEL)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.EMAIL_LABEL)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.PASSWORD_LABEL)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.POSTAL_CODE_LABEL)
    ).toBeInTheDocument();
  });

  it("submits the form values", async () => {
    const onSubmit = vi.fn();

    render(<RegisterForm onSubmit={onSubmit} />);

    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.NAME_LABEL),
      "Ada Lovelace"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.EMAIL_LABEL),
      "ada@example.com"
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.PASSWORD_LABEL),
      TEST_PASSWORD
    );
    await userEvent.type(
      screen.getByLabelText(UI_TEXT.AUTH.REGISTER.POSTAL_CODE_LABEL),
      "28001"
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.AUTH.REGISTER.SUBMIT_LABEL })
    );

    expect(onSubmit).toHaveBeenCalledWith({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: TEST_PASSWORD,
      postalCode: "28001",
    });
  });
});
