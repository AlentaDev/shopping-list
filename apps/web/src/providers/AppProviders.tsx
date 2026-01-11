import type { ReactNode } from "react";
import { ListProvider } from "../context/ListContext";
import { ToastProvider } from "../context/ToastContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <ListProvider>{children}</ListProvider>
    </ToastProvider>
  );
}
