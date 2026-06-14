// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LIST_STATUS } from "@src/shared/domain/listStatus";
import { UI_TEXT } from "@src/shared/constants/ui";
import { ListDetailModal } from "./ListDetailModal";

const selectedList = {
  id: "active-1",
  title: "Cena",
  updatedAt: "2024-01-09",
  activatedAt: "2024-01-08",
  itemCount: 3,
  isEditing: false,
  status: LIST_STATUS.ACTIVE,
  provider: {
    slug: "bonpreuesclat",
    displayName: "Bonpreu Esclat",
  },
};

const selectedListDetail = {
  ...selectedList,
  items: [
    {
      id: "item-1",
      kind: "catalog" as const,
      name: "Leche",
      qty: 2,
      checked: false,
      updatedAt: "2024-01-09",
      price: 1.2,
      categorySnapshot: "Lácteos",
    },
  ],
};

describe("ListDetailModal", () => {
  it("locks body scroll while open and restores it on close", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    document.body.style.overflow = "scroll";

    const { unmount } = render(
      <ListDetailModal
        actionLoading={null}
        detailActions={["edit", "delete"]}
        onAction={vi.fn()}
        onClose={onClose}
        selectedList={selectedList}
        selectedListDetail={selectedListDetail}
      />,
    );

    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: UI_TEXT.LISTS.DETAIL_MODAL.CLOSE_LABEL }));

    expect(onClose).toHaveBeenCalledTimes(1);

    unmount();

    expect(document.body.style.overflow).toBe("scroll");
  });

  it("closes on Escape like the legacy modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <ListDetailModal
        actionLoading={null}
        detailActions={["edit", "delete"]}
        onAction={vi.fn()}
        onClose={onClose}
        selectedList={selectedList}
        selectedListDetail={selectedListDetail}
      />,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
