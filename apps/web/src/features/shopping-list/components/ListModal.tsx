import { type ReactNode, useEffect, useId, useRef } from "react";
import { UI_TEXT } from "@src/shared/constants/ui";

type ListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onReadyToShop?: () => void;
  children: ReactNode;
  title?: string;
};

const ListModal = ({
  isOpen,
  onClose,
  onReadyToShop,
  children,
  title,
}: ListModalProps) => {
  const titleId = useId();
  const previousOverflow = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousOverflow.current = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow.current ?? "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        data-testid="list-modal-backdrop"
        className="fixed inset-0 bg-black/40"
        onClick={onClose}
        aria-label={UI_TEXT.LIST_MODAL.CLOSE_MODAL_LABEL}
      />
      <div className="pointer-events-none fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="pointer-events-auto w-full max-w-lg rounded-2xl bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 id={titleId} className="text-xl font-semibold text-slate-900">
              {title ?? UI_TEXT.LIST_MODAL.DEFAULT_LIST_TITLE}
            </h2>
          </div>
          <div className="px-6 py-4">{children}</div>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 px-6 py-4">
            {onReadyToShop ? (
              <button
                type="button"
                onClick={onReadyToShop}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {UI_TEXT.LIST_MODAL.READY_TO_SHOP_LABEL}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListModal;
