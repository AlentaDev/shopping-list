import { SUPPORTED_PROVIDERS, getProviderDisplayName } from "@src/shared/constants/providers";
import { UI_TEXT } from "@src/shared/constants/ui";

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
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">{UI_TEXT.HOME.TITLE}</h1>
      <p className="text-sm text-slate-600">{UI_TEXT.HOME.SUBTITLE}</p>
      {draftGuidance ? <p className="text-sm text-slate-600">{draftGuidance}</p> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {SUPPORTED_PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={() => onSelectProvider(provider.id)}
          >
            {UI_TEXT.HOME.PROVIDER_ENTRY_LABEL.replace(
              "{provider}",
              getProviderDisplayName(provider.id),
            )}
          </button>
        ))}
      </div>
    </section>
  );
};
