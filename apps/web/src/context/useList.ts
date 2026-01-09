import { useContext } from "react";
import { ListContext, type ListContextType } from "./ListContextValue";

export function useList(): ListContextType {
  const context = useContext(ListContext);

  if (!context) {
    throw new Error("useList must be used within a ListProvider");
  }

  return context;
}
