import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ToastContext,
  type ToastContextType,
  type ToastEntry,
  type ToastValue,
} from "./ToastContextValue";

const AUTO_HIDE_MS = 3000;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const toastIdRef = useRef(0);

  const clearTimer = useCallback(() => {
    timersRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    timersRef.current.clear();
  }, []);

  const clearToastTimer = useCallback((toastId: string) => {
    const timerId = timersRef.current.get(toastId);
    if (timerId) {
      window.clearTimeout(timerId);
      timersRef.current.delete(toastId);
    }
  }, []);

  const hideToast = useCallback(
    (toastId: string) => {
      setToasts((current) => current.filter((toast) => toast.id !== toastId));
      clearToastTimer(toastId);
    },
    [clearToastTimer]
  );

  const showToast = useCallback(
    (nextToast: ToastValue) => {
      toastIdRef.current += 1;
      const toastId = `toast-${toastIdRef.current}`;
      setToasts((current) => [...current, { ...nextToast, id: toastId }]);
      const timerId = window.setTimeout(() => {
        hideToast(toastId);
      }, AUTO_HIDE_MS);
      timersRef.current.set(toastId, timerId);
    },
    [hideToast]
  );

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer]
  );

  const value: ToastContextType = useMemo(
    () => ({
      toasts,
      showToast,
      hideToast,
    }),
    [toasts, showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
