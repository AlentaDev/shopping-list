import { createContext } from "react";

export type ToastValue = {
  message: string;
  productName: string;
  thumbnail?: string | null;
};

export type ToastEntry = ToastValue & {
  id: string;
};

export type ToastContextType = {
  toasts: ToastEntry[];
  showToast: (toast: ToastValue) => void;
  hideToast: (toastId: string) => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);
