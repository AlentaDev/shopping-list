import { useEffect, useState } from "react";

const getMatches = (query: string) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(query).matches;
};

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQueryList = window.matchMedia(query);
    const updateMatches = (event?: MediaQueryListEvent) => {
      setMatches(event?.matches ?? mediaQueryList.matches);
    };

    updateMatches();

    if (typeof mediaQueryList.addEventListener === "function") {
      mediaQueryList.addEventListener("change", updateMatches);

      return () => {
        mediaQueryList.removeEventListener("change", updateMatches);
      };
    }

    mediaQueryList.addListener?.(updateMatches);

    return () => {
      mediaQueryList.removeListener?.(updateMatches);
    };
  }, [query]);

  return matches;
};
