// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UI_TEXT } from "@src/shared/constants/ui";
import ListsScreen, { type ListSummary } from "./ListsScreen";
import { LIST_STATUS } from "../services/listActions";

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
    render(<ListsScreen lists={[]} />);

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
    render(<ListsScreen lists={[]} />);

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
    render(<ListsScreen lists={sampleLists} />);

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
});
