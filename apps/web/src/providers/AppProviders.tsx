import type { ReactNode } from "react";
import { ApiAwakeProvider } from "@src/context/ApiAwakeContext";
import { AuthProvider } from "@src/context/AuthContext";
import { ListProvider } from "@src/context/ListContext";
import { ToastProvider } from "@src/context/ToastContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ToastProvider>
      <ApiAwakeProvider>
        <AuthProvider>
          <ListProvider>{children}</ListProvider>
        </AuthProvider>
      </ApiAwakeProvider>
    </ToastProvider>
  );
}
