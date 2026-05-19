const MOBILE_WIDTH_QUERY = "(max-width: 767px)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
const LANDSCAPE_QUERY = "(orientation: landscape)";
const SHORT_VIEWPORT_QUERY = "(max-height: 500px)";

const matchesMediaQuery = (query: string) => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(query).matches;
};

export const isMobileCatalogInteractionMode = () => {
  const isMobileWidth = matchesMediaQuery(MOBILE_WIDTH_QUERY);

  if (isMobileWidth) {
    return true;
  }

  const isCoarsePointer = matchesMediaQuery(COARSE_POINTER_QUERY);
  const isLandscape = matchesMediaQuery(LANDSCAPE_QUERY);
  const isShortViewport = matchesMediaQuery(SHORT_VIEWPORT_QUERY);

  return isCoarsePointer && isLandscape && isShortViewport;
};
