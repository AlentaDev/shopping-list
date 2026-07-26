import { useCallback, useEffect, useRef } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";

export type DraftProviderConflictModalProps = {
  isOpen: boolean;
  message: string;
  currentProviderName: string;
  requestedProviderName: string;
  onConfirm: () => void;
  onDismiss: () => void;
};

export const DraftProviderConflictModal = ({
  isOpen,
  message,
  onConfirm,
  onDismiss,
}: DraftProviderConflictModalProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;
    confirmButtonRef.current?.focus();

    return () => {
      previouslyFocusedElement.current?.focus();
    };
  }, [isOpen]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) {
        return;
      }

      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      );

      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onDismiss],
  );

  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onDismiss();
      }
    },
    [onDismiss],
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      data-testid="draft-provider-conflict-backdrop"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.TITLE}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold text-slate-900">
          {UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.TITLE}
        </h2>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            {UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.CONFIRM_LABEL}
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            {UI_TEXT.CATALOG.DRAFT_PROVIDER_CONFLICT_MODAL.DISMISS_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
};
