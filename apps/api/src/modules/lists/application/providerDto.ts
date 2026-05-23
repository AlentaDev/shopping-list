import { resolveListProviderSlug } from "../domain/list.js";

export type ListProviderDto = {
  slug: string;
  displayName: string;
};

const PROVIDER_DISPLAY_NAME_BY_SLUG: Record<string, string> = {
  mercadona: "Mercadona",
};

export function toListProviderDto(
  providerId: string | null | undefined,
): ListProviderDto {
  const slug = resolveListProviderSlug(providerId);

  return {
    slug,
    displayName: PROVIDER_DISPLAY_NAME_BY_SLUG[slug] ?? slug,
  };
}
