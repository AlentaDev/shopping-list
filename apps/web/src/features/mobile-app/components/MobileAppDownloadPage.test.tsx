// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { MobileAppDownloadPage } from "@src/features/mobile-app/components/MobileAppDownloadPage";

describe("MobileAppDownloadPage", () => {
  it("presenta Android 1.0 estable, su recorrido y los límites reales", () => {
    render(<MobileAppDownloadPage />);

    expect(
      screen.getByRole("heading", { name: UI_TEXT.APP_DOWNLOAD.TITLE }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: UI_TEXT.APP_DOWNLOAD.DOWNLOAD_BUTTON_LABEL,
      }),
    ).toHaveAttribute("href", UI_TEXT.APP_DOWNLOAD.RELEASE.APK_URL);
    expect(screen.getByText(/v1\.0\.0/)).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.APP_DOWNLOAD.INSTALL_STEPS.TITLE),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: UI_TEXT.APP_DOWNLOAD.HOW_IT_WORKS.TITLE,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.APP_DOWNLOAD.CONNECTION.TITLE),
    ).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.APP_DOWNLOAD.SCOPE_LIMITS.TITLE),
    ).toBeInTheDocument();
    expect(screen.queryByText(/beta/i)).not.toBeInTheDocument();
  });
});
