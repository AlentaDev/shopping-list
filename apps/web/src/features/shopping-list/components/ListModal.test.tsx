// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ListModal from "./ListModal";

const MODAL_BACKDROP_TEST_ID = "list-modal-backdrop";

describe("ListModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens and closes", () => {
    const { rerender } = render(
      <ListModal isOpen onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Mi lista")).toBeInTheDocument();

    rerender(
      <ListModal isOpen={false} onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes on ESC", async () => {
    const onClose = vi.fn();

    render(
      <ListModal isOpen onClose={onClose} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes when clicking the backdrop", async () => {
    const onClose = vi.fn();

    render(
      <ListModal isOpen onClose={onClose} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    await userEvent.click(screen.getByTestId(MODAL_BACKDROP_TEST_ID));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables body scroll while open and restores it on close", () => {
    document.body.style.overflow = "auto";

    const { rerender } = render(
      <ListModal isOpen onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <ListModal isOpen={false} onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    expect(document.body.style.overflow).toBe("auto");
  });

  it("backdrop disappears immediately when isOpen becomes false", async () => {
    const { rerender } = render(
      <ListModal isOpen onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    expect(screen.getByTestId(MODAL_BACKDROP_TEST_ID)).toBeInTheDocument();

    rerender(
      <ListModal isOpen={false} onClose={vi.fn()} title="Mi lista">
        <p>Contenido</p>
      </ListModal>,
    );

    // El backdrop debe desaparecer inmediatamente (sin necesidad de waitFor)
    expect(
      screen.queryByTestId(MODAL_BACKDROP_TEST_ID),
    ).not.toBeInTheDocument();
  });

  it("backdrop click is not blocked by modal content", async () => {
    const onClose = vi.fn();

    render(
      <ListModal isOpen onClose={onClose} title="Mi lista">
        <div>
          <p>Contenido muy largo que ocupa bastante espacio</p>
          <p>Más contenido</p>
          <button>Botón dentro del modal</button>
        </div>
      </ListModal>,
    );

    const backdrop = screen.getByTestId(MODAL_BACKDROP_TEST_ID);

    // El backdrop debe ser clickeable incluso con contenido dentro
    await userEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
