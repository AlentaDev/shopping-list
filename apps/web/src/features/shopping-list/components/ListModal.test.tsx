// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListModal from "./ListModal";

describe("ListModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens and closes", () => {
    const { rerender } = render(
      <ListModal isOpen onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Mi lista")).toBeInTheDocument();

    rerender(
      <ListModal isOpen={false} onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on ESC", async () => {
    const onClose = vi.fn();

    render(
      <ListModal isOpen onClose={onClose} title="Mi lista">
        <p>Contenido</p>
      </ListModal>
    );

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop", async () => {
    const onClose = vi.fn();

    render(
      <ListModal isOpen onClose={onClose} title="Mi lista">
        <p>Contenido</p>
      </ListModal>
    );

    await userEvent.click(screen.getByTestId("list-modal-backdrop"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables body scroll while open and restores it on close", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(
      <ListModal isOpen onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <ListModal isOpen={false} onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>
    );

    expect(document.body.style.overflow).toBe("auto");
  });
});
