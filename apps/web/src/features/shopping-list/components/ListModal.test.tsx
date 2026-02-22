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

  it("muestra y ejecuta la acción de lista lista para comprar", async () => {
    const onReadyToShop = vi.fn();

    render(
      <ListModal isOpen onClose={vi.fn()} onReadyToShop={onReadyToShop}>
        <p>Contenido</p>
      </ListModal>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Finalizar lista" }),
    );

    expect(onReadyToShop).toHaveBeenCalledTimes(1);
  });

  it("permite editar el título inline cuando se habilita la edición", async () => {
    const onTitleSubmit = vi.fn();

    render(
      <ListModal
        isOpen
        onClose={vi.fn()}
        title="Mi lista"
        onTitleSubmit={onTitleSubmit}
      >
        <p>Contenido</p>
      </ListModal>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Editar título" }),
    );

    const input = screen.getByRole("textbox", { name: "Título de la lista" });
    await userEvent.clear(input);
    await userEvent.type(input, "Compra semanal");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar título" }),
    );

    expect(onTitleSubmit).toHaveBeenCalledWith("Compra semanal");
  });



  it("prioriza acciones explícitas de edición activa en el footer", () => {
    render(
      <ListModal
        isOpen
        onClose={vi.fn()}
        title="Mi lista"
        footerContent={
          <>
            <button type="button">Finalizar edición</button>
            <button type="button">Cancelar edición</button>
          </>
        }
        onReadyToShop={vi.fn()}
        hideDefaultReadyToShopAction
      >
        <p>Contenido</p>
      </ListModal>,
    );

    expect(
      screen.getByRole("button", { name: "Finalizar edición" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancelar edición" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Finalizar lista" }),
    ).not.toBeInTheDocument();
  });

  it("renderiza acciones personalizadas en el footer", () => {
    render(
      <ListModal
        isOpen
        onClose={vi.fn()}
        title="Mi lista"
        footerContent={<button type="button">Acción custom</button>}
      >
        <p>Contenido</p>
      </ListModal>,
    );

    expect(
      screen.getByRole("button", { name: "Acción custom" }),
    ).toBeInTheDocument();
  });

  it("muestra validación con zod si el título tiene menos de 3 caracteres", async () => {
    const onTitleSubmit = vi.fn();

    render(
      <ListModal
        isOpen
        onClose={vi.fn()}
        title="Mi lista"
        onTitleSubmit={onTitleSubmit}
      >
        <p>Contenido</p>
      </ListModal>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Editar título" }),
    );

    const input = screen.getByRole("textbox", { name: "Título de la lista" });
    await userEvent.clear(input);
    await userEvent.type(input, "ab");
    await userEvent.click(
      screen.getByRole("button", { name: "Guardar título" }),
    );

    expect(
      screen.getByText("El título debe tener entre 3 y 35 caracteres."),
    ).toBeInTheDocument();
    expect(onTitleSubmit).not.toHaveBeenCalled();
  });
});
