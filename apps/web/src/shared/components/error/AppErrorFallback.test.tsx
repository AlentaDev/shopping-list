// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UI_TEXT } from "@src/shared/constants/ui";
import { AppErrorFallback } from "@src/shared/components/error/AppErrorFallback";

describe("AppErrorFallback", () => {
  it("muestra mensaje breve y profesional en inglés", () => {
    render(<AppErrorFallback />);

    expect(
      screen.getByRole("heading", { name: UI_TEXT.ERROR_BOUNDARY.TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByText(UI_TEXT.ERROR_BOUNDARY.MESSAGE)).toBeInTheDocument();
  });
});
