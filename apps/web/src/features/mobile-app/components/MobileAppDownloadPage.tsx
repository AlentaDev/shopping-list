import { UI_TEXT } from "@src/shared/constants/ui";

export const MobileAppDownloadPage = () => {
  const release = UI_TEXT.APP_DOWNLOAD.RELEASE;

  return (
    <section className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
          {UI_TEXT.APP_DOWNLOAD.BADGE_LABEL}
        </span>
        <h1 className="text-3xl font-semibold text-slate-900">
          {UI_TEXT.APP_DOWNLOAD.TITLE}
        </h1>
        <p className="text-slate-600">{UI_TEXT.APP_DOWNLOAD.SUBTITLE}</p>
      </header>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <a
          href={release.APK_URL}
          className="inline-flex rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {UI_TEXT.APP_DOWNLOAD.DOWNLOAD_BUTTON_LABEL}
        </a>
        <p className="mt-3 text-sm text-slate-600">
          {UI_TEXT.APP_DOWNLOAD.VERSION_LABEL} {release.VERSION} · {" "}
          {UI_TEXT.APP_DOWNLOAD.UPDATED_AT_LABEL} {release.UPDATED_AT}
        </p>
      </div>

      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {UI_TEXT.APP_DOWNLOAD.INSTALL_STEPS.TITLE}
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-slate-700">
          <li>{UI_TEXT.APP_DOWNLOAD.INSTALL_STEPS.FIRST}</li>
          <li>{UI_TEXT.APP_DOWNLOAD.INSTALL_STEPS.SECOND}</li>
          <li>{UI_TEXT.APP_DOWNLOAD.INSTALL_STEPS.THIRD}</li>
        </ol>
      </article>

      <article className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          {UI_TEXT.APP_DOWNLOAD.KNOWN_LIMITATIONS.TITLE}
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>{UI_TEXT.APP_DOWNLOAD.KNOWN_LIMITATIONS.FIRST}</li>
          <li>{UI_TEXT.APP_DOWNLOAD.KNOWN_LIMITATIONS.SECOND}</li>
          <li>{UI_TEXT.APP_DOWNLOAD.KNOWN_LIMITATIONS.THIRD}</li>
        </ul>
      </article>
    </section>
  );
};
