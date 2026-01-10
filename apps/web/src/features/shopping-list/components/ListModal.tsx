import { type ReactNode, useEffect, useId, useRef } from "react";

type ListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
};

const ListModal = ({ isOpen, onClose, children, title }: ListModalProps) => {
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
        aria-label="Cerrar modal"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 id={titleId} className="text-xl font-semibold text-slate-900">
              {title ?? "Tu lista"}
            </h2>
          </div>
          <div className="px-6 py-4">{children}</div>
          <div className="flex justify-end border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListModal;
