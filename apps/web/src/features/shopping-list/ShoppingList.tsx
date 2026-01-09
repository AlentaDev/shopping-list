import { useMemo, useState } from "react";
import ItemList from "./components/ItemList";
import ListModal from "./components/ListModal";
import Total from "./components/Total";
import { useList } from "../../context/useList";

type ShoppingListProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ViewMode = "list" | "save";

const ShoppingList = ({
  isOpen,
  onClose,
}: ShoppingListProps) => {
  const { items, total, updateQuantity, removeItem } = useList();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listName, setListName] = useState("");

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
  const handleIncrement = (id: string) => {
    const currentQuantity =
      items.find((item) => item.id === id)?.quantity ?? 1;
    updateQuantity(id, currentQuantity + 1);
  };

  const handleDecrement = (id: string) => {
    const currentQuantity =
      items.find((item) => item.id === id)?.quantity ?? 1;
    updateQuantity(id, currentQuantity - 1);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
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
