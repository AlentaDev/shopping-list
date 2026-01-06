type ListItem = {
  id: string;
  name: string;
  thumbnail: string;
  price: number;
  unitPrice: number;
  unitFormat: "kg" | "L" | "g" | "ud" | string;
};

const formatEuro = (value: number): string =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatUnitPrice = (value: number, unit: string): string =>
  `${formatEuro(value)}/${unit}`;

const items: ListItem[] = [
  {
    id: "queso-curado",
    name: "Queso curado mezcla a peso",
    thumbnail:
      "https://prod-mercadona.imgix.net/queso-curado-mezcla.jpg?auto=format&fit=crop&w=400&h=400",
    price: 5.59,
    unitPrice: 14.15,
    unitFormat: "kg",
  },
  {
    id: "aceite-oliva",
    name: "Aceite de oliva virgen extra 1 L",
    thumbnail:
      "https://prod-mercadona.imgix.net/aceite-oliva-virgen-extra.jpg?auto=format&fit=crop&w=400&h=400",
    price: 6.95,
    unitPrice: 6.95,
    unitFormat: "L",
  },
  {
    id: "tomate-pera",
    name: "Tomate pera selección",
    thumbnail:
      "https://prod-mercadona.imgix.net/tomate-pera.jpg?auto=format&fit=crop&w=400&h=400",
    price: 2.15,
    unitPrice: 2.15,
    unitFormat: "kg",
  },
  {
    id: "pasta-integral",
    name: "Pasta integral fusilli",
    thumbnail:
      "https://prod-mercadona.imgix.net/pasta-integral-fusilli.jpg?auto=format&fit=crop&w=400&h=400",
    price: 1.29,
    unitPrice: 4.1,
    unitFormat: "kg",
  },
  {
    id: "cafe-molido",
    name: "Café molido natural 250 g",
    thumbnail:
      "https://prod-mercadona.imgix.net/cafe-molido-natural.jpg?auto=format&fit=crop&w=400&h=400",
    price: 1.75,
    unitPrice: 7,
    unitFormat: "kg",
  },
  {
    id: "chocolate-negro",
    name: "Chocolate negro 70% cacao tablet",
    thumbnail:
      "https://prod-mercadona.imgix.net/chocolate-negro-70.jpg?auto=format&fit=crop&w=400&h=400",
    price: 1.1,
    unitPrice: 11,
    unitFormat: "kg",
  },
];

function App() {
  const hasItems = items.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">La lista de la compra</h1>
            <div className="relative">
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
              {hasItems ? (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-semibold text-white">
                  {items.length}
                </span>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Login
            </button>
            <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900">
              Registro
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-full px-4 py-8">
        {hasItems ? (
          <div className="flex justify-center">
            <div className="grid gap-4 grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 *:w-48">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="flex h-full flex-col rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex flex-col p-3">
                    <div className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="mt-3 space-y-1">
                      <h2 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold text-slate-900">
                        {item.name}
                      </h2>
                      <div className="text-base font-semibold text-slate-900">
                        {formatEuro(item.price)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {formatUnitPrice(item.unitPrice, item.unitFormat)}
                      </div>
                    </div>
                    <button className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-600">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Añadir
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-lg font-semibold text-slate-800">
              Tu lista está vacía
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Añade productos para empezar.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
