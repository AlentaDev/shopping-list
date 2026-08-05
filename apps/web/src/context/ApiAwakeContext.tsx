import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiAwakeContext } from "./useApiAwake";

const API_AWAKE_MAX_ATTEMPTS = 5;
const API_AWAKE_BASE_DELAY_MS = 400;
const API_AWAKE_MAX_DELAY_MS = 2_000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type ApiAwakeProviderProps = {
  children: ReactNode;
};

export function ApiAwakeProvider({ children }: ApiAwakeProviderProps) {
  const [apiAwake, setApiAwake] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkApiAwake = async () => {
      for (let attempt = 0; attempt < API_AWAKE_MAX_ATTEMPTS; attempt += 1) {
        try {
          const response = await fetch("/health");
          if (response.ok) {
            if (!cancelled) {
              setApiAwake(true);
            }
            return;
          }
        } catch {
          // bounded retry while API wakes up
        }

        const isLastAttempt = attempt === API_AWAKE_MAX_ATTEMPTS - 1;
        if (!isLastAttempt) {
          const delay = Math.min(
            API_AWAKE_BASE_DELAY_MS * 2 ** attempt,
            API_AWAKE_MAX_DELAY_MS,
          );
          await sleep(delay);
        }
      }
    };

    void checkApiAwake();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ apiAwake }), [apiAwake]);

  return (
    <ApiAwakeContext.Provider value={value}>{children}</ApiAwakeContext.Provider>
  );
}
