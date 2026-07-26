// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DraftProviderConflictModal } from "./DraftProviderConflictModal";
import { UI_TEXT } from "@src/shared/constants/ui";

const message =
  "Tu borrador actual pertenece a Mercadona. Si continúas, lo vaciaremos para empezar una nueva lista en Bonpreu Esclat.";

const renderModal = (props: {
  isOpen?: boolean;
  onConfirm?: () => void;
  onDismiss?: () => void;
}) =>
  render(
    <DraftProviderConflictModal
      isOpen={props.isOpen ?? true}
      message={message}
      currentProviderName="Mercadona"
      requestedProviderName="Bonpreu Esclat"
      onConfirm={props.onConfirm ?? vi.fn()}
      onDismiss={props.onDismiss ?? vi.fn()}
    />,
  );

describe("DraftProviderConflictModal", () => {
  it("renders the conflict message with provider names", () => {
    renderModal({});

    expect(
      screen.getByRole("dialog", {
        name: UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.TITLE,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("exposes role='dialog' and aria-modal='true'", () => {
    renderModal({});

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("fires onConfirm when the confirm button is clicked", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    renderModal({ onConfirm });

    await user.click(
      screen.getByRole("button", {
        name: UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.CONFIRM_LABEL,
      }),
    );

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when the dismiss button is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    renderModal({ onDismiss });

    await user.click(
      screen.getByRole("button", {
        name: UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.DISMISS_LABEL,
      }),
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    renderModal({ onDismiss });

    await user.keyboard("{Escape}");

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("fires onDismiss when the backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    renderModal({ onDismiss });

    await user.click(
      screen.getByRole("dialog").parentElement as HTMLElement,
    );

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("keeps focus cycling between the modal buttons", async () => {
    const user = userEvent.setup();
    renderModal({});

    const confirmButton = screen.getByRole("button", {
      name: UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.CONFIRM_LABEL,
    });
    const dismissButton = screen.getByRole("button", {
      name: UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.DISMISS_LABEL,
    });

    expect(confirmButton).toHaveFocus();

    await user.tab();
    expect(dismissButton).toHaveFocus();

    await user.tab();
    expect(confirmButton).toHaveFocus();

    await user.tab({ shift: true });
    expect(dismissButton).toHaveFocus();
  });

  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });

    expect(
      screen.queryByRole("dialog", {
        name: UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.TITLE,
      }),
    ).not.toBeInTheDocument();
  });
});
