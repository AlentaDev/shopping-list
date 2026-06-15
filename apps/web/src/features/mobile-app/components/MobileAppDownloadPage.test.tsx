// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { MobileAppDownloadPage } from "@src/features/mobile-app/components/MobileAppDownloadPage";

describe("MobileAppDownloadPage", () => {
  it("renderiza CTA de descarga e información de release", () => {
    render(<MobileAppDownloadPage />);

    expect(
      screen.getByRole("heading", { name: UI_TEXT.APP_DOWNLOAD.TITLE }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: UI_TEXT.APP_DOWNLOAD.DOWNLOAD_BUTTON_LABEL,
      }),
    ).toHaveAttribute("href", UI_TEXT.APP_DOWNLOAD.RELEASE.APK_URL);
    expect(screen.getByText(/v0\.10\.3/)).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.APP_DOWNLOAD.INSTALL_STEPS.TITLE),
    ).toBeInTheDocument();
  });
});
