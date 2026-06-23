// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UI_TEXT } from "@src/shared/constants/ui";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import type { ListSummary } from "../services/types";
import { ListCard } from "./ListCard";
import { formatListCardDate } from "./formatListCardDate";

const activeList: ListSummary = {
  id: "active-1",
  title: "Cena",
  updatedAt: "2026-06-07",
  activatedAt: "2026-06-06",
  itemCount: 4,
  isEditing: false,
  status: LIST_STATUS.ACTIVE,
  provider: {
    slug: "bonpreuesclat",
    displayName: "Bonpreu Esclat",
  },
};

const draftList: ListSummary = {
  id: "draft-1",
  title: "Borrador",
  updatedAt: "2026-06-08",
  activatedAt: null,
  itemCount: 2,
  isEditing: false,
  status: LIST_STATUS.DRAFT,
  provider: {
    slug: "mercadona",
    displayName: "Mercadona",
  },
};

const unknownProviderList: ListSummary = {
  ...activeList,
  id: "active-unknown-provider",
  providerId: "super-sol",
  provider: {
    slug: "super-sol",
    displayName: "Super Sol",
  },
};

describe("ListCard", () => {
  it("oculta el nombre del proveedor visible y muestra la jerarquía tipográfica en tres líneas", () => {
    render(
      <ListCard
        list={activeList}
        actionLoading={null}
        onAction={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    const card = screen.getByTestId("list-card-active-1");
    const title = screen.getByRole("heading", { name: "Cena" });
    const itemCountLine = screen.getByText(`${UI_TEXT.LISTS.CARD.ITEM_COUNT_LABEL} 4`);
    const statusLine = screen.getByText(
      `${UI_TEXT.LISTS.CARD.ACTIVATED_AT_LABEL} 6 junio, 2026`,
    );
    const deleteButton = screen.getByRole("button", {
      name: UI_TEXT.LISTS.ACTIONS.DELETE,
    });

    expect(card).not.toHaveTextContent("Bonpreu Esclat");
    expect(title).toHaveClass("text-lg");
    expect(itemCountLine).toHaveClass("font-bold", "text-slate-900");
    expect(statusLine).toHaveClass("font-normal", "text-slate-900");
    expect(statusLine).not.toHaveClass("font-bold");
    expect(deleteButton).toHaveClass("rounded-full", "border-red-600", "text-red-600");
    expect(deleteButton).not.toHaveClass("bg-red-600", "text-white");
    expect(deleteButton.querySelector("svg")).not.toBeNull();
  });

  it("usa en la tarjeta el mismo trash icon del modal draft con un tamaño un poco mayor", () => {
    render(
      <ListCard
        list={activeList}
        actionLoading={null}
        onAction={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: UI_TEXT.LISTS.ACTIONS.DELETE,
    });
    const icon = deleteButton.querySelector("svg");

    expect(deleteButton).toHaveAttribute("aria-label", UI_TEXT.LISTS.ACTIONS.DELETE);
    expect(deleteButton).toHaveClass("h-10", "w-10", "rounded-full");
    expect(deleteButton).not.toHaveClass("bg-red-600");
    expect(icon).toHaveAttribute("viewBox", "0 0 24 24");
    expect(icon).toHaveAttribute("fill", "none");
    expect(icon).toHaveAttribute("stroke", "currentColor");
    expect(icon).toHaveAttribute("stroke-width", "1.6");
    expect(icon).toHaveClass("h-5", "w-5");

    const paths = icon?.querySelectorAll("path");

    expect(paths).toHaveLength(5);
    expect(paths?.[0]).toHaveAttribute("d", "M3 6h18");
    expect(paths?.[1]).toHaveAttribute("d", "M8 6V4h8v2");
    expect(paths?.[2]).toHaveAttribute("d", "M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14");
    expect(paths?.[3]).toHaveAttribute("d", "M10 11v6");
    expect(paths?.[4]).toHaveAttribute("d", "M14 11v6");
  });

  it("muestra para borradores una fecha de actualización en lugar de tratarlos como completados", () => {
    render(
      <ListCard
        list={draftList}
        actionLoading={null}
        onAction={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    expect(
      screen.getByText(`${UI_TEXT.LISTS.UPDATED_AT_LABEL} ${formatListCardDate(draftList.updatedAt)}`),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(
        `${UI_TEXT.LISTS.CARD.COMPLETED_AT_LABEL} ${formatListCardDate(draftList.updatedAt)}`,
      ),
    ).not.toBeInTheDocument();
  });

  it("muestra el nombre completo del proveedor cuando no existe logo conocido", () => {
    render(
      <ListCard
        list={unknownProviderList}
        actionLoading={null}
        onAction={vi.fn()}
        onOpenDetail={vi.fn()}
      />,
    );

    expect(screen.getByText("Super Sol")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("aísla los clicks entre abrir detalle y borrar", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();
    const onOpenDetail = vi.fn();

    render(
      <ListCard
        list={activeList}
        actionLoading={null}
        onAction={onAction}
        onOpenDetail={onOpenDetail}
      />,
    );

    const card = screen.getByTestId("list-card-active-1");
    const deleteButton = screen.getByRole("button", {
      name: UI_TEXT.LISTS.ACTIONS.DELETE,
    });

    await user.click(deleteButton);

    expect(onAction).toHaveBeenCalledTimes(1);
    expect(onAction).toHaveBeenCalledWith(activeList, "delete");
    expect(onOpenDetail).not.toHaveBeenCalled();

    await user.click(card);

    expect(onOpenDetail).toHaveBeenCalledTimes(1);
    expect(onOpenDetail).toHaveBeenCalledWith(activeList);
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("formatea fechas con Intl y elimina 'de' cuando el locale lo agrega", () => {
    expect(formatListCardDate("2026-06-07")).toBe("7 junio, 2026");
    expect(formatListCardDate("2026-04-26")).toBe("26 abril, 2026");
    expect(formatListCardDate("2026-06-07T19:59:49.619Z")).toBe("7 junio, 2026");
    expect(formatListCardDate("2026-01-26T00:00:00.000Z")).toBe("26 enero, 2026");
  });
});
