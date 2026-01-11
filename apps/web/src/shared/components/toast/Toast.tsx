import { useToast } from "../../../context/useToast";

const Toast = () => {
  const { toasts, hideToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3"
      data-testid="toast-stack"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="w-[280px] rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <div className="flex items-start gap-3 p-4">
            <div className="h-12 w-12 overflow-hidden rounded-xl bg-slate-100">
              {toast.thumbnail ? (
                <img
                  src={toast.thumbnail}
                  alt={toast.productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-400">
                  Sin imagen
                </div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-emerald-600">
                {toast.message}
              </p>
              <p className="text-sm font-medium text-slate-900">
                {toast.productName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => hideToast(toast.id)}
              aria-label="Cerrar notificación"
              className="text-slate-400 transition hover:text-slate-600"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Toast;
