import { useMediaQuery } from "@src/shared/hooks/useMediaQuery";

const MOBILE_WIDTH_QUERY = "(max-width: 767px)";
const COARSE_POINTER_QUERY = "(pointer: coarse)";
const LANDSCAPE_QUERY = "(orientation: landscape)";
const SHORT_VIEWPORT_QUERY = "(max-height: 500px)";

export const useMobileCatalogInteractionMode = () => {
  const isMobileWidth = useMediaQuery(MOBILE_WIDTH_QUERY);
  const isCoarsePointer = useMediaQuery(COARSE_POINTER_QUERY);
  const isLandscape = useMediaQuery(LANDSCAPE_QUERY);
  const isShortViewport = useMediaQuery(SHORT_VIEWPORT_QUERY);

  if (isMobileWidth) {
    return true;
  }

  return isCoarsePointer && isLandscape && isShortViewport;
};
