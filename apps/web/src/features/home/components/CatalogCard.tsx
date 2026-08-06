type CatalogCardProps = {
  providerId: string;
  logoSrc: string;
  logoAlt: string;
  ctaLabel: string;
  onSelect: (providerId: string) => void;
};

export const CatalogCard = ({
  providerId,
  logoSrc,
  logoAlt,
  ctaLabel,
  onSelect,
}: CatalogCardProps) => (
  <article className="flex min-h-[20rem] flex-col items-center justify-center rounded-[1.75rem] bg-white px-6 py-8 text-center shadow-sm ring-1 ring-slate-200 sm:px-8 sm:py-10">
    <div className="flex min-h-40 items-center justify-center">
      <img src={logoSrc} alt={logoAlt} className="max-h-32 w-auto object-contain" />
    </div>
    <div className="mt-6 flex w-full justify-center">
      <button
        type="button"
        className="inline-flex self-center items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600"
        onClick={() => onSelect(providerId)}
      >
        {ctaLabel}
      </button>
    </div>
  </article>
);
