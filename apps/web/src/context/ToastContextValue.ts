import { createContext } from "react";

export type ToastValue = {
  message: string;
  productName: string;
  thumbnail?: string | null;
};

export type ToastContextType = {
  toast: ToastValue | null;
  showToast: (toast: ToastValue) => void;
  hideToast: () => void;
};

export const ToastContext = createContext<ToastContextType | undefined>(
  undefined
);
