import { UI_TEXT } from "@src/shared/constants/ui";

export const AppErrorFallback = () => (
  <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
    <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-lg font-semibold text-slate-900">
        {UI_TEXT.ERROR_BOUNDARY.TITLE}
      </h1>
      <p className="mt-2 text-sm text-slate-600">{UI_TEXT.ERROR_BOUNDARY.MESSAGE}</p>
    </section>
  </main>
);
