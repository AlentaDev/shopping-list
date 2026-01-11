import { useState } from "react";
import Catalog from "./features/catalog/Catalog";
import ShoppingList from "./features/shopping-list/ShoppingList";
import { useList } from "./context/useList";
import Toast from "./shared/components/toast/Toast";

const App = () => {
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { linesCount } = useList();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full items-center justify-between gap-3 sm:flex-1 sm:w-auto sm:justify-start">
            <div>
              <p className="text-xl font-semibold sm:text-2xl">
                La lista de la compra
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              aria-label="Abrir carrito"
              className="relative cursor-pointer"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-6 w-6 text-slate-700"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 .95-.68L21 8H6" />
                <circle cx="10" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
              </svg>
              {linesCount > 0 ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold tabular-nums text-white">
                  {linesCount}
                </span>
              ) : null}
            </button>
          </div>
          <div className="mt-4 flex w-full items-center gap-2 sm:mt-0 sm:w-auto sm:justify-end">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((prev) => !prev)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                isCategoriesOpen
                  ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                  : "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900"
              }`}
              aria-pressed={isCategoriesOpen}
            >
              Categorías
            </button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Login
            </button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Registro
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Catalog isCategoriesOpen={isCategoriesOpen} />
      </main>
      <ShoppingList
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
      <Toast />
    </div>
  );
};

export default App;
