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
    id: "draft-1",
    title: "Compra semanal",
    updatedAt: "2024-01-10",
    status: LIST_STATUS.DRAFT,
  },
  {
    id: "active-1",
    title: "Cena",
    updatedAt: "2024-01-09",
    status: LIST_STATUS.ACTIVE,
  },
  {
    id: "completed-1",
    title: "Navidad",
    updatedAt: "2024-01-01",
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
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.DRAFT })
    ).toBeInTheDocument();
    expect(
      screen.getByText(UI_TEXT.LISTS.EMPTY_STATE.DRAFT_TITLE)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.EMPTY_STATE.DRAFT_CTA })
    ).toBeInTheDocument();
  });

  it("cambia entre tabs y muestra el texto vacío correspondiente", async () => {
    render(
      <ListsScreen lists={[]} onAction={vi.fn()} onCreate={vi.fn()} />
    );

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.ACTIVE })
    );

    expect(
      screen.getByText(UI_TEXT.LISTS.EMPTY_STATE.ACTIVE_TITLE)
    ).toBeInTheDocument();

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

    expect(screen.getByText("Compra semanal")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.EDIT })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.ACTIVATE })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.ACTIVE })
    );

    expect(screen.getByText("Cena")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.COMPLETE })
    ).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    expect(screen.getByText("Navidad")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DUPLICATE })
    ).toBeInTheDocument();
  });

  it("dispara callbacks de acción y creación", async () => {
    const onAction = vi.fn();
    const onCreate = vi.fn();

    render(
      <ListsScreen lists={sampleLists} onAction={onAction} onCreate={onCreate} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.ACTIVATE })
    );

    expect(onAction).toHaveBeenCalledWith("draft-1", "activate");

    await userEvent.click(
      screen.getByRole("tab", { name: UI_TEXT.LISTS.TABS.COMPLETED })
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.ACTIONS.DUPLICATE })
    );

    expect(onAction).toHaveBeenCalledWith("completed-1", "duplicate");

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.NEW_LIST_LABEL })
    );

    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it("dispara onCreate desde el empty state", async () => {
    const onCreate = vi.fn();

    render(
      <ListsScreen lists={[]} onAction={vi.fn()} onCreate={onCreate} />
    );

    await userEvent.click(
      screen.getByRole("button", { name: UI_TEXT.LISTS.EMPTY_STATE.DRAFT_CTA })
    );

    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
