import {
  SUPPORTED_PROVIDERS,
  getProviderCardImageInfo,
  getProviderDisplayName,
} from "@src/shared/constants/providers";
import { UI_TEXT } from "@src/shared/constants/ui";
import { CatalogCard } from "./CatalogCard";
import { CatalogHero } from "./CatalogHero";

const PROVIDER_CONTENT = {
  mercadona: {
    ctaLabel: UI_TEXT.HOME.PROVIDERS.MERCADONA.CTA_LABEL,
  },
  bonpreuesclat: {
    ctaLabel: UI_TEXT.HOME.PROVIDERS.BONPREUESCLAT.CTA_LABEL,
  },
} as const;

type CatalogHomeProps = {
  draftProviderId?: string | null;
  showAnonymousDraftGuidance?: boolean;
  onSelectProvider: (providerId: string) => void;
};

export const CatalogHome = ({
  draftProviderId = null,
  showAnonymousDraftGuidance = false,
  onSelectProvider,
}: CatalogHomeProps) => {
  const draftGuidance =
    showAnonymousDraftGuidance && draftProviderId
      ? UI_TEXT.HOME.ANONYMOUS_DRAFT_GUIDANCE.replace(
          "{provider}",
          getProviderDisplayName(draftProviderId),
        )
      : null;

  return (
    <section className="space-y-10 pb-8">
      <CatalogHero draftGuidance={draftGuidance} />

      <div id="providers" className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            {UI_TEXT.HOME.PROVIDERS_SECTION_TITLE}
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            {UI_TEXT.HOME.PROVIDERS_SECTION_SUBTITLE}
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {SUPPORTED_PROVIDERS.map((provider) => {
            const providerContent = PROVIDER_CONTENT[provider.id];
            const providerCardImage = getProviderCardImageInfo(provider.id)!;

            return (
              <CatalogCard
                key={provider.id}
                providerId={provider.id}
                logoSrc={providerCardImage.src}
                logoAlt={providerCardImage.alt}
                ctaLabel={providerContent.ctaLabel}
                onSelect={onSelectProvider}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};
