// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UI_TEXT } from "@src/shared/constants/ui";
import ListsScreen from "./ListsScreen";
import { LIST_STATUS } from "../services/listActions";
import type { ListSummary } from "../services/types";

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
    id: "completed-1",
    title: "Navidad",
    updatedAt: "2024-01-01",
    activatedAt: null,
    itemCount: 5,
    isEditing: false,
    status: LIST_STATUS.COMPLETED,
  },
];

describe("ListsScreen", () => {
  it("muestra las tabs y el estado vacío por defecto", () => {
    render(
      <ListsScreen lists={[]} onAction={vi.fn()} onCreate={vi.fn()} />
    );

    expect(
      screen.getByRole("heading", { name: UI_TEXT.LISTS.TITLE })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.ACTIVE })
    ).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.LISTS.EMPTY_STATE.ACTIVE_TITLE)
    ).toBeInTheDocument();
  });

  it("cambia entre tabs y muestra el texto vacío correspondiente", async () => {
    render(
      <ListsScreen lists={[]} onAction={vi.fn()} onCreate={vi.fn()} />
    );

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    expect(
      screen.getByText(UI_TEXT.LISTS.EMPTY_STATE.COMPLETED_TITLE)
    ).toBeInTheDocument();
  });

  it("muestra acciones según el estado", async () => {
    render(
      <ListsScreen lists={sampleLists} onAction={vi.fn()} onCreate={vi.fn()} />
    );

    expect(screen.getByText("Cena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.COMPLETE })
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${UI_TEXT.LISTS.CARD.ITEM_COUNT_LABEL} 3`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${UI_TEXT.LISTS.CARD.ACTIVATED_AT_LABEL} 2024-01-08`)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    expect(screen.getByText("Navidad")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE })
    ).toBeInTheDocument();
  });

  it("dispara callbacks de acción y creación", async () => {
    const onAction = vi.fn();
    const onCreate = vi.fn();

    render(
      <ListsScreen
        lists={sampleLists}
        onAction={onAction}
        onCreate={onCreate}
        hasDraftItems={false}
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.COMPLETE })
    );

    expect(onAction).toHaveBeenCalledWith("active-1", "complete");

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.REUSE })
    );

    expect(onAction).toHaveBeenCalledWith("completed-1", "reuse");

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.NEW_LIST_LABEL })
    );

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("muestra aviso de pérdida de borrador al editar con ítems", async () => {
    const onAction = vi.fn();

    render(
      <ListsScreen
        lists={sampleLists}
        onAction={onAction}
        onCreate={vi.fn()}
        hasDraftItems
      />
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT })
    );

    expect(
      screen.getByText(UI_TEXT.LISTS.DRAFT_LOSS.TITLE)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.LISTS.DRAFT_LOSS.CONFIRM_LABEL,
      })
    );

    expect(onAction).toHaveBeenCalledWith("active-1", "edit");
  });

  it("muestra confirmación antes de borrar una lista", async () => {
    const onAction = vi.fn();

    render(
      <ListsScreen lists={sampleLists} onAction={onAction} onCreate={vi.fn()} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DELETE })
    );

    expect(
      screen.getByText(UI_TEXT.LISTS.DELETE_CONFIRMATION.TITLE)
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.LISTS.DELETE_CONFIRMATION.CONFIRM_LABEL,
      })
    );

    expect(onAction).toHaveBeenCalledWith("active-1", "delete");
  });

  it("dispara onCreate desde el botón principal", async () => {
    const onCreate = vi.fn();

    render(
      <ListsScreen lists={[]} onAction={vi.fn()} onCreate={onCreate} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.NEW_LIST_LABEL })
    );

    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
