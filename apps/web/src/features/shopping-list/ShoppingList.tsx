import { useEffect, useMemo, useState } from "react";
import ItemList from "./components/ItemList";
import ListModal from "./components/ListModal";
import Total from "./components/Total";
import type { ShoppingListItem } from "./types";

const INITIAL_ITEMS: ShoppingListItem[] = [
  {
    id: "item-1",
    name: "Manzanas Fuji",
    category: "Frutas",
    thumbnail:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=120&q=80",
    price: 1.2,
    quantity: 1,
  },
  {
    id: "item-2",
    name: "Leche entera",
    category: "Bebidas",
    thumbnail: null,
    price: 0.95,
    quantity: 2,
  },
  {
    id: "item-3",
    name: "Pan integral multicereal extra largo",
    category: "Panadería",
    thumbnail:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=120&q=80",
    price: 1.5,
    quantity: 1,
  },
];

type ShoppingListProps = {
  isOpen: boolean;
  onClose: () => void;
  onLinesCountChange?: (count: number) => void;
};

type ViewMode = "list" | "save";

const ShoppingList = ({
  isOpen,
  onClose,
  onLinesCountChange,
}: ShoppingListProps) => {
  const [items, setItems] = useState<ShoppingListItem[]>(INITIAL_ITEMS);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listName, setListName] = useState("");

  const linesCount = items.length;
  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        const categoryComparison = left.category.localeCompare(right.category);

        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return left.name.localeCompare(right.name);
      }),
    [items]
  );
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  useEffect(() => {
    onLinesCountChange?.(linesCount);
  }, [linesCount, onLinesCountChange]);

  const handleIncrement = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecrement = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleStartSave = () => {
    setViewMode("save");
  };

  const handleCancelSave = () => {
    setViewMode("list");
  };

  const handleConfirmSave = () => {
    setViewMode("list");
  };

  return (
    <ListModal isOpen={isOpen} onClose={onClose} title="Tu lista">
      {viewMode === "list" ? (
        <div className="space-y-6">
          <ItemList
            items={sortedItems}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
          />
          <Total total={total} onAddMore={onClose} onSave={handleStartSave} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="shopping-list-name"
              className="text-sm font-semibold text-slate-700"
            >
              Nombre de la lista
            </label>
            <input
              id="shopping-list-name"
              type="text"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder="Ej. Compra semanal"
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancelSave}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Guardar
            </button>
          </div>
        </div>
      )}
    </ListModal>
  );
};

export default ShoppingList;
