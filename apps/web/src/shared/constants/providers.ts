import { UI_TEXT } from "@src/shared/constants/ui";

export const SUPPORTED_PROVIDERS = [{ id: "mercadona" }] as const;

export type SupportedProviderId = (typeof SUPPORTED_PROVIDERS)[number]["id"];

type ProviderLogoInfo = {
  src: string;
  alt: string;
};

type ProviderCardImageInfo = {
  src: string;
  alt: string;
};

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  mercadona: UI_TEXT.PROVIDERS.MERCADONA.DISPLAY_NAME,
  bonpreuesclat: UI_TEXT.PROVIDERS.BONPREUESCLAT.DISPLAY_NAME,
};

const PROVIDER_LOGOS: Record<string, ProviderLogoInfo> = {
  mercadona: {
    src: "/images/providers/mercadona/logo.png",
    alt: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT,
  },
  bonpreuesclat: {
    src: "/images/providers/bonpreuesclat/logo.png",
    alt: UI_TEXT.PROVIDERS.BONPREUESCLAT.DISPLAY_NAME,
  },
};

const PROVIDER_CARD_IMAGES: Record<SupportedProviderId, ProviderCardImageInfo> = {
  mercadona: {
    src: "/images/providers/mercadona/card.png",
    alt: UI_TEXT.HOME.PROVIDERS.MERCADONA.LOGO_ALT,
  },
};

export const getProviderDisplayName = (providerId: string): string =>
  PROVIDER_DISPLAY_NAMES[providerId] ?? providerId;

export const getProviderLogoInfo = (
  providerId: string | null | undefined,
): ProviderLogoInfo | null => {
  if (!providerId) {
    return null;
  }

  return PROVIDER_LOGOS[providerId] ?? null;
};

export const getProviderCardImageInfo = (
  providerId: string | null | undefined,
): ProviderCardImageInfo | null => {
  if (!providerId) {
    return null;
  }

  return PROVIDER_CARD_IMAGES[providerId as SupportedProviderId] ?? null;
};
