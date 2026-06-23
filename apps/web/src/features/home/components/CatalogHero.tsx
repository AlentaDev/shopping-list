import { UI_TEXT } from "@src/shared/constants/ui";

type CatalogHeroProps = {
  draftGuidance?: string | null;
};

export const CatalogHero = ({ draftGuidance = null }: CatalogHeroProps) => (
  <div className="grid gap-8 overflow-hidden rounded-[2rem] bg-white px-6 py-8 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10 lg:py-10">
    <div className="order-2 space-y-5 lg:order-1">
      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
        {UI_TEXT.APP.TITLE}
      </span>
      <div className="space-y-3">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
          {UI_TEXT.HOME.HERO_TITLE}
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
          {UI_TEXT.HOME.HERO_SUBTITLE}
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <a
          href="#providers"
          className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
        >
          {UI_TEXT.HOME.PRIMARY_CTA_LABEL}
        </a>
        <a
          href="/app"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
        >
          {UI_TEXT.HOME.DOWNLOAD_APP_CTA_LABEL}
        </a>
      </div>
      {draftGuidance ? (
        <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{draftGuidance}</p>
      ) : null}
    </div>
    <div className="order-1 lg:order-2">
      <img
        src="/images/productos.png"
        alt={UI_TEXT.HOME.HERO_IMAGE_ALT}
        className="h-full w-full rounded-[1.75rem] bg-slate-100 object-cover"
      />
    </div>
  </div>
);
