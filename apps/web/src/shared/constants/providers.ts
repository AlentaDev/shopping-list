import { UI_TEXT } from "@src/shared/constants/ui";

export const SUPPORTED_PROVIDERS = [{ id: "mercadona" }, { id: "bonpreuesclat" }] as const;

export type SupportedProviderId = (typeof SUPPORTED_PROVIDERS)[number]["id"];

const PROVIDER_DISPLAY_NAMES: Record<SupportedProviderId, string> = {
  mercadona: UI_TEXT.PROVIDERS.MERCADONA.DISPLAY_NAME,
  bonpreuesclat: UI_TEXT.PROVIDERS.BONPREUESCLAT.DISPLAY_NAME,
};

export const getProviderDisplayName = (providerId: string): string =>
  PROVIDER_DISPLAY_NAMES[providerId as SupportedProviderId] ?? providerId;
