import { useCallback, useMemo, useState } from "react";
import ItemList from "./components/ItemList";
import ListModal from "./components/ListModal";
import Total from "./components/Total";
import AutosaveRecoveryBanner from "./components/AutosaveRecoveryBanner";
import { useList } from "@src/context/useList";
import { useAuth } from "@src/context/useAuth";
import type { ShoppingListItem } from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";
import { SHOPPING_LIST_VIEW } from "@src/shared/constants/appState";
import { useAutosaveDraft } from "./services/useAutosaveDraft";
import { useAutosaveRecovery } from "./services/useAutosaveRecovery";
import type { AutosaveDraftInput } from "./services/types";
import { activateList } from "./services/ListStatusService";
import { deleteListItem } from "./services/ListItemsService";
import {
  LIST_STATUS,
  canActivateList,
  type ListStatus,
} from "./services/listStatus";

type ShoppingListProps = {
  isOpen: boolean;
  onClose: () => void;
  initialListId?: string | null;
  initialListStatus?: ListStatus;
  initialListTitle?: string;
};

type ViewMode = typeof SHOPPING_LIST_VIEW.LIST | typeof SHOPPING_LIST_VIEW.SAVE;

const ShoppingList = ({
  isOpen,
  onClose,
  initialListId,
  initialListStatus,
  initialListTitle,
}: ShoppingListProps) => {
  const { authUser } = useAuth();
  const { items, total, updateQuantity, removeItem, setItems } = useList();
  const [viewMode, setViewMode] = useState<ViewMode>(SHOPPING_LIST_VIEW.LIST);
  const [listName, setListName] = useState(initialListTitle ?? "");
  const [listTitle, setListTitle] = useState<string>(
    initialListTitle ?? UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
  );
  const [listId, setListId] = useState<string | null>(initialListId ?? null);
  const [listStatus, setListStatus] = useState<ListStatus>(
    initialListStatus ?? LIST_STATUS.LOCAL_DRAFT,
  );
  const [pendingRemoval, setPendingRemoval] =
    useState<ShoppingListItem | null>(null);
  const canReadyToShop = Boolean(authUser) && canActivateList(listStatus);
  const draftTitle = listName.trim() || listTitle;

  const handleRehydrate = useCallback(
    (draft: AutosaveDraftInput) => {
      if (items.length > 0 || draft.items.length === 0) {
        return;
      }

      const restoredTitle =
        draft.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE;
      const restoredItems = draft.items.map((item) => ({
        id: item.id,
        name: item.name,
        category: "",
        thumbnail: item.thumbnail ?? null,
        price: item.price ?? null,
        quantity: item.qty,
      }));

      setItems(restoredItems);
      setListName(draft.title);
      setListTitle(restoredTitle);
    },
    [items.length, setItems],
  );

  useAutosaveDraft(
    { title: draftTitle, items },
    {
      enabled: items.length > 0 && Boolean(authUser),
      onRehydrate: handleRehydrate,
    },
  );

  const { draft: autosaveDraft, handleContinue, handleDiscard } =
    useAutosaveRecovery({
      enabled: Boolean(authUser),
      onRehydrate: handleRehydrate,
    });

  const handleClose = () => {
    setPendingRemoval(null);
    onClose();
  };

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

  const handleRemoveRequest = (item: ShoppingListItem) => {
    setPendingRemoval(item);
  };

  const handleCancelRemove = () => {
    setPendingRemoval(null);
  };

  const handleConfirmRemove = async () => {
    if (!pendingRemoval) {
      return;
    }

    try {
      if (listId) {
        await deleteListItem({ listId, itemId: pendingRemoval.id });
      }

      removeItem(pendingRemoval.id);
      setPendingRemoval(null);
    } catch (error) {
      console.warn("No se pudo eliminar el item.", error);
    }
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

  const handleReadyToShop = useCallback(async () => {
    if (!authUser || !canActivateList(listStatus)) {
      return;
    }

    try {
      const response = await activateList({
        status: listStatus,
        listId,
      });
      setListId(response.id);
      setListStatus(response.status);
    } catch (error) {
      console.warn("No se pudo activar la lista.", error);
    }
  }, [authUser, listId, listStatus]);

  return (
    <ListModal
      isOpen={isOpen}
      onClose={handleClose}
      title={listTitle}
      onReadyToShop={canReadyToShop ? handleReadyToShop : undefined}
    >
      {viewMode === SHOPPING_LIST_VIEW.LIST ? (
        <div className="space-y-6">
          {autosaveDraft ? (
            <AutosaveRecoveryBanner
              onContinue={handleContinue}
              onDiscard={handleDiscard}
            />
          ) : null}
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
              onRemove={handleRemoveRequest}
            />
          )}
          <Total total={total} onAddMore={handleClose} onSave={handleStartSave} />
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
      {pendingRemoval ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {UI_TEXT.SHOPPING_LIST.DELETE_CONFIRMATION.TITLE}
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {UI_TEXT.SHOPPING_LIST.DELETE_CONFIRMATION.MESSAGE}{" "}
              <span className="font-semibold text-slate-800">
                {pendingRemoval.name}
              </span>
              .
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleCancelRemove}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                {UI_TEXT.SHOPPING_LIST.DELETE_CONFIRMATION.CANCEL_LABEL}
              </button>
              <button
                type="button"
                onClick={handleConfirmRemove}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                {UI_TEXT.SHOPPING_LIST.DELETE_CONFIRMATION.CONFIRM_LABEL}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ListModal>
  );
};

export default ShoppingList;
