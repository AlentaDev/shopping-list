import { createContext, useContext } from "react";

type ApiAwakeContextValue = {
  apiAwake: boolean;
};

export const ApiAwakeContext = createContext<ApiAwakeContextValue | undefined>(
  undefined,
);

export function useApiAwake() {
  return useContext(ApiAwakeContext) ?? { apiAwake: true };
}
