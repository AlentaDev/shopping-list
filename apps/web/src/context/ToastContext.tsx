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
  type ToastValue,
} from "./ToastContextValue";

const AUTO_HIDE_MS = 3000;

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toast, setToast] = useState<ToastValue | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (nextToast: ToastValue) => {
      setToast(nextToast);
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, AUTO_HIDE_MS);
    },
    [clearTimer]
  );

  const hideToast = useCallback(() => {
    setToast(null);
    clearTimer();
  }, [clearTimer]);

  useEffect(
    () => () => {
      clearTimer();
    },
    [clearTimer]
  );

  const value: ToastContextType = useMemo(
    () => ({
      toast,
      showToast,
      hideToast,
    }),
    [toast, showToast, hideToast]
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}
