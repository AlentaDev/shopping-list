// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UI_TEXT } from "@src/shared/constants/ui";
import ListsScreen from "./ListsScreen";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import type { ListDetail, ListSummary } from "../services/types";

const sampleLists: ListSummary[] = [
  {
    id: "active-1",
    title: "Cena",
    updatedAt: "2024-01-09",
    activatedAt: "2024-01-08",
    itemCount: 3,
    isEditing: false,
    status: LIST_STATUS.ACTIVE,
  },
  {
    id: "draft-1",
    title: "Vacía",
    updatedAt: "2024-01-10",
    activatedAt: null,
    itemCount: 0,
    isEditing: false,
    status: LIST_STATUS.DRAFT,
  },
  {
    id: "completed-1",
    title: "Navidad",
    updatedAt: "2024-01-01",
    activatedAt: null,
    itemCount: 5,
    isEditing: false,
    status: LIST_STATUS.COMPLETED,
  },
];

const selectedDetail: ListDetail = {
  id: "active-1",
  title: "Cena",
  updatedAt: "2024-01-09",
  activatedAt: "2024-01-08",
  itemCount: 3,
  isEditing: false,
  status: LIST_STATUS.ACTIVE,
  items: [
    {
      id: "item-1",
      kind: "catalog",
      name: "Leche",
      qty: 2,
      checked: false,
      updatedAt: "2024-01-09",
      price: 1.2,
    },
  ],
};

describe("ListsScreen", () => {
  it("muestra las tabs y el estado vacío por defecto", () => {
    render(
      <ListsScreen
        lists={[]}
        onAction={vi.fn()}
        selectedList={null}
        selectedListDetail={null}
        onOpenDetail={vi.fn()}
        onCloseDetail={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: UI_TEXT.LISTS.TITLE }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.ACTIVE }),
    ).toBeInTheDocument();
    expect(screen.getByText(UI_TEXT.LISTS.EMPTY_STATE.ACTIVE_TITLE)).toBeInTheDocument();
  });

  it("en listas activas mantiene borrar en tarjeta y abre detalle al hacer click", async () => {
    const onOpenDetail = vi.fn();

    render(
      <ListsScreen
        lists={sampleLists}
        onAction={vi.fn()}
        selectedList={null}
        selectedListDetail={null}
        onOpenDetail={onOpenDetail}
        onCloseDetail={vi.fn()}
      />,
    );

    const activeCard = screen.getByTestId("list-card-active-1");
    const draftCard = screen.getByTestId("list-card-draft-1");

    expect(activeCard).toHaveClass("cursor-pointer");
    expect(draftCard).not.toHaveClass("cursor-pointer");

    expect(
      within(activeCard as HTMLElement).getByRole("button", {
        name: UI_TEXT.LISTS.ACTIONS.DELETE,
      }),
    ).toBeInTheDocument();

    expect(
      within(activeCard as HTMLElement).queryByRole("button", {
        name: UI_TEXT.LISTS.ACTIONS.COMPLETE,
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(activeCard);

    expect(onOpenDetail).toHaveBeenCalledWith(sampleLists[0]);
  });

  it("muestra modal read-only con acciones para lista activa", async () => {
    const onAction = vi.fn();
    const onCloseDetail = vi.fn();

    render(
      <ListsScreen
        lists={sampleLists}
        onAction={onAction}
        selectedList={sampleLists[0]}
        selectedListDetail={selectedDetail}
        onOpenDetail={vi.fn()}
        onCloseDetail={onCloseDetail}
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByTestId("list-modal-backdrop")).toBeInTheDocument();
    expect(within(dialog).getByText("Leche")).toBeInTheDocument();
    expect(within(dialog).getByText("Productos: 2")).toBeInTheDocument();
    expect(within(dialog).getAllByText(/2,40\s*€/)).toHaveLength(2);
    expect(within(dialog).getByTestId("list-detail-item-item-1")).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Añadir más productos" }),
    ).not.toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "Finalizar lista" }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT }),
    );
    expect(onAction).toHaveBeenCalledWith(sampleLists[0], "edit");

    await userEvent.click(
      within(dialog).getByRole("button", { name: UI_TEXT.LISTS.DETAIL_MODAL.CLOSE_LABEL }),
    );
    expect(onCloseDetail).toHaveBeenCalled();
  });

  it("muestra acciones reuse/delete/close para completadas", async () => {
    const onAction = vi.fn();

    render(
      <ListsScreen
        lists={sampleLists}
        onAction={onAction}
        selectedList={sampleLists[2]}
        selectedListDetail={{ ...selectedDetail, id: "completed-1", status: LIST_STATUS.COMPLETED }}
        onOpenDetail={vi.fn()}
        onCloseDetail={vi.fn()}
      />,
    );

    const dialog = screen.getByRole("dialog");

    expect(
      within(dialog).getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE }),
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT }),
    ).not.toBeInTheDocument();

    await userEvent.click(
      within(dialog).getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE }),
    );

    expect(onAction).toHaveBeenCalledWith(sampleLists[2], "reuse");
  });
});
