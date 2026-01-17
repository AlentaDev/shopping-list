// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AuthLoggedInNotice from "./AuthLoggedInNotice";
import { UI_TEXT } from "@src/shared/constants/ui";

describe("AuthLoggedInNotice", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows the login message and returns home on button click", async () => {
    const onBack = vi.fn();

    render(<AuthLoggedInNotice mode="login" onBack={onBack} />);

    expect(
      screen.getByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.LOGIN_MESSAGE),
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.AUTH.ALREADY_LOGGED_IN.BACK_HOME_LABEL,
      }),
    );

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("auto-redirects after 15 seconds", () => {
    const onBack = vi.fn();

    vi.useFakeTimers();

    render(<AuthLoggedInNotice mode="register" onBack={onBack} />);

    expect(
      screen.getByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.REGISTER_MESSAGE),
    ).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.AUTH.ALREADY_LOGGED_IN.AUTO_REDIRECT_MESSAGE),
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15000);
    });

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
