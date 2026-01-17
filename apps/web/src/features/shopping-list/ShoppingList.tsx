import { useMemo, useState } from "react";
import ItemList from "./components/ItemList";
import ListModal from "./components/ListModal";
import Total from "./components/Total";
import { useList } from "@src/context/useList";
import type { ShoppingListItem } from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";
import { SHOPPING_LIST_VIEW } from "@src/shared/constants/appState";

type ShoppingListProps = {
  isOpen: boolean;
  onClose: () => void;
};

type ViewMode = typeof SHOPPING_LIST_VIEW.LIST | typeof SHOPPING_LIST_VIEW.SAVE;

const ShoppingList = ({ isOpen, onClose }: ShoppingListProps) => {
  const { items, total, updateQuantity, removeItem } = useList();
  const [viewMode, setViewMode] = useState<ViewMode>(SHOPPING_LIST_VIEW.LIST);
  const [listName, setListName] = useState("");
  const [listTitle, setListTitle] = useState<string>(
    UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
  );

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        const categoryComparison = left.category.localeCompare(right.category);

        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return left.name.localeCompare(right.name);
      }),
    [items],
  );
  const handleIncrement = (id: string) => {
    const currentQuantity = items.find((item) => item.id === id)?.quantity ?? 1;
    updateQuantity(id, currentQuantity + 1);
  };

  const handleDecrement = (id: string) => {
    const currentQuantity = items.find((item) => item.id === id)?.quantity ?? 1;
    updateQuantity(id, currentQuantity - 1);
  };

  const handleRemove = (id: string) => {
    removeItem(id);
  };

  const handleStartSave = () => {
    setViewMode(SHOPPING_LIST_VIEW.SAVE);
  };

  const handleCancelSave = () => {
    setViewMode(SHOPPING_LIST_VIEW.LIST);
  };

  const handleConfirmSave = () => {
    const trimmedName = listName.trim();

    setListTitle(trimmedName || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE);
    setViewMode(SHOPPING_LIST_VIEW.LIST);
  };

  return (
    <ListModal isOpen={isOpen} onClose={onClose} title={listTitle}>
      {viewMode === SHOPPING_LIST_VIEW.LIST ? (
        <div className="space-y-6">
          {sortedItems.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <p className="text-sm font-semibold text-slate-700">
                {UI_TEXT.SHOPPING_LIST.EMPTY_LIST_TITLE}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {UI_TEXT.SHOPPING_LIST.EMPTY_LIST_SUBTITLE}
              </p>
            </div>
          ) : (
            <ItemList
              items={sortedItems as ShoppingListItem[]}
              onIncrement={handleIncrement}
              onDecrement={handleDecrement}
              onRemove={handleRemove}
            />
          )}
          <Total total={total} onAddMore={onClose} onSave={handleStartSave} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="shopping-list-name"
              className="text-sm font-semibold text-slate-700"
            >
              {UI_TEXT.SHOPPING_LIST.LIST_NAME_LABEL}
            </label>
            <input
              id="shopping-list-name"
              type="text"
              value={listName}
              onChange={(event) => setListName(event.target.value)}
              placeholder={UI_TEXT.SHOPPING_LIST.LIST_NAME_PLACEHOLDER}
              className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleCancelSave}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
            >
              {UI_TEXT.SHOPPING_LIST.CANCEL_LABEL}
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              {UI_TEXT.SHOPPING_LIST.SAVE_LABEL}
            </button>
          </div>
        </div>
      )}
    </ListModal>
  );
};

export default ShoppingList;
