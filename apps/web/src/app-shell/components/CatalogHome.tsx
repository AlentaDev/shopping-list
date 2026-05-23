type CatalogHomeProps = {
  onGoToCatalog: () => void;
};

export const CatalogHome = ({ onGoToCatalog }: CatalogHomeProps) => {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold text-slate-900">Tu lista de compras</h1>
      <p className="text-sm text-slate-600">Elige un catálogo para empezar a crear tu lista.</p>
      <button
        type="button"
        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        onClick={onGoToCatalog}
      >
        Ir al catálogo
      </button>
    </section>
  );
};
