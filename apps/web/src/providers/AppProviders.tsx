import type { ReactNode } from "react";
import { ListProvider } from "../context/ListContext";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return <ListProvider>{children}</ListProvider>;
}
