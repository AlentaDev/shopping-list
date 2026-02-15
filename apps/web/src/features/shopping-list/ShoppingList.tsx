import { useCallback, useMemo, useState } from "react";
import ItemList from "./components/ItemList";
import ListModal from "./components/ListModal";
import Total from "./components/Total";
import AutosaveConflictModal from "./components/AutosaveConflictModal";
import { useList } from "@src/context/useList";
import { useAuth } from "@src/context/useAuth";
import { useToast } from "@src/context/useToast";
import type { ShoppingListItem } from "./types";
import { UI_TEXT } from "@src/shared/constants/ui";
import { useAutosaveDraft } from "./services/useAutosaveDraft";
import { saveLocalDraft } from "./services/AutosaveService";
import { useAutosaveRecovery } from "./services/useAutosaveRecovery";
import type { AutosaveDraftInput } from "./services/types";
import { activateList } from "./services/ListStatusService";
import { deleteListItem } from "./services/ListItemsService";
import { adaptShoppingListItems } from "./services/adapters/ShoppingListItemAdapter";
import { deleteList, reuseList } from "./services/ListDetailActionsService";
import { LIST_STATUS, type ListStatus } from "@src/shared/domain/listStatus";
import { canActivateList } from "./services/listStatus";

type ShoppingListProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddMoreProducts?: () => void;
  initialListId?: string | null;
  initialListStatus?: ListStatus;
  initialListTitle?: string;
  isLoading?: boolean;
};

const DETAIL_ACTION_BASE_CLASS =
  "rounded-full border px-4 py-2 text-sm font-semibold transition";
const DETAIL_ACTION_DISABLED_CLASS =
  "cursor-not-allowed border-slate-200 text-slate-300";
const DETAIL_ACTION_ENABLED_CLASS =
  "border-slate-300 text-slate-700 hover:border-slate-400 hover:text-slate-900";
const DETAIL_ACTION_DELETE_CLASS =
  "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50";

const getDetailActionClassName = (
  isDisabled: boolean,
  enabledClass: string,
) =>
  `${DETAIL_ACTION_BASE_CLASS} ${
    isDisabled ? DETAIL_ACTION_DISABLED_CLASS : enabledClass
  }`;


type DetailActionsProps = {
  isActive: boolean;
  onReuse: () => void;
  onDelete: () => void;
  isDisabled?: boolean;
  loadingAction?: "reuse" | "delete" | null;
};

const DetailActions = ({
  isActive,
  onReuse,
  onDelete,
  isDisabled = false,
  loadingAction = null,
}: DetailActionsProps) => (
  <div className="flex flex-wrap gap-2">
    {isActive ? null : (
      <button
        type="button"
        onClick={onReuse}
        disabled={isDisabled}
        className={getDetailActionClassName(
          isDisabled,
          DETAIL_ACTION_ENABLED_CLASS,
        )}
      >
        {loadingAction === "reuse"
          ? UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS_LOADING.REUSE
          : UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.REUSE}
      </button>
    )}
    <button
      type="button"
      onClick={onDelete}
      disabled={isDisabled}
      className={getDetailActionClassName(
        isDisabled,
        DETAIL_ACTION_DELETE_CLASS,
      )}
    >
      {loadingAction === "delete"
        ? UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS_LOADING.DELETE
        : UI_TEXT.SHOPPING_LIST.DETAIL_ACTIONS.DELETE}
    </button>
  </div>
);

type DeleteListConfirmationProps = {
  isOpen: boolean;
  listTitle: string;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteListConfirmation = ({
  isOpen,
  listTitle,
  onCancel,
  onConfirm,
}: DeleteListConfirmationProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
      >
        <h3 className="text-lg font-semibold text-slate-900">
          {UI_TEXT.SHOPPING_LIST.DELETE_LIST_CONFIRMATION.TITLE}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          {UI_TEXT.SHOPPING_LIST.DELETE_LIST_CONFIRMATION.MESSAGE}{" "}
          <span className="font-semibold text-slate-800">{listTitle}</span>.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
          >
            {UI_TEXT.SHOPPING_LIST.DELETE_LIST_CONFIRMATION.CANCEL_LABEL}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
          >
            {UI_TEXT.SHOPPING_LIST.DELETE_LIST_CONFIRMATION.CONFIRM_LABEL}
          </button>
        </div>
      </div>
    </div>
  );
};

const ShoppingListSkeleton = () => (
  <div
    data-testid="shopping-list-skeleton"
    className="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6"
  >
    <div className="h-4 w-1/3 animate-pulse rounded-full bg-slate-200" />
    <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200" />
    <div className="h-4 w-1/2 animate-pulse rounded-full bg-slate-200" />
    <div className="mt-4 h-10 w-full animate-pulse rounded-2xl bg-slate-200" />
  </div>
);

const ShoppingListTotalSkeleton = () => (
  <div
    data-testid="shopping-list-total-skeleton"
    className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
  >
    <div className="h-4 w-1/4 animate-pulse rounded-full bg-slate-200" />
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <div className="h-9 w-full animate-pulse rounded-full bg-slate-200 sm:w-40" />
      <div className="h-9 w-full animate-pulse rounded-full bg-slate-200 sm:w-40" />
    </div>
  </div>
);

type ShoppingListListViewProps = {
  showDetailActions: boolean;
  isActiveList: boolean;
  onReuse: () => void;
  onDelete: () => void;
  isActionsDisabled: boolean;
  detailActionLoading: "reuse" | "delete" | null;
  isLoading: boolean;
  sortedItems: ShoppingListItem[];
  isReadOnlyMobile: boolean;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onRemove: (item: ShoppingListItem) => void;
  total: number;
  onAddMore: () => void;
};

const ShoppingListListView = ({
  showDetailActions,
  isActiveList,
  onReuse,
  onDelete,
  isActionsDisabled,
  detailActionLoading,
  isLoading,
  sortedItems,
  isReadOnlyMobile,
  onIncrement,
  onDecrement,
  onRemove,
  total,
  onAddMore,
}: ShoppingListListViewProps) => {
  const renderListContent = () => {
    if (isLoading) {
      return <ShoppingListSkeleton />;
    }

    if (sortedItems.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
          <p className="text-sm font-semibold text-slate-700">
            {UI_TEXT.SHOPPING_LIST.EMPTY_LIST_TITLE}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {UI_TEXT.SHOPPING_LIST.EMPTY_LIST_SUBTITLE}
          </p>
        </div>
      );
    }

    return (
      <ItemList
        items={sortedItems}
        onIncrement={onIncrement}
        onDecrement={onDecrement}
        onRemove={onRemove}
        isReadOnly={isReadOnlyMobile}
      />
    );
  };

  return (
    <div className="space-y-6">
      {showDetailActions ? (
        <DetailActions
          isActive={isActiveList}
          onReuse={onReuse}
          onDelete={onDelete}
          isDisabled={isActionsDisabled}
          loadingAction={detailActionLoading}
        />
      ) : null}
      {renderListContent()}
      {isLoading ? (
        <ShoppingListTotalSkeleton />
      ) : (
        <Total total={total} onAddMore={onAddMore} />
      )}
    </div>
  );
};

const ShoppingList = ({
  isOpen,
  onClose,
  initialListId,
  initialListStatus,
  initialListTitle,
  isLoading = false,
  onAddMoreProducts,
}: ShoppingListProps) => {
  const { authUser } = useAuth();
  const { showToast } = useToast();
  const { items, total, updateQuantity, removeItem, setItems } = useList();
  const [listName, setListName] = useState(initialListTitle ?? "");
  const [listTitle, setListTitle] = useState<string>(
    initialListTitle ?? UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
  );
  const [listId, setListId] = useState<string | null>(initialListId ?? null);
  const [listStatus, setListStatus] = useState<ListStatus>(
    initialListStatus ?? LIST_STATUS.LOCAL_DRAFT,
  );
  const [detailActionLoading, setDetailActionLoading] = useState<
    "reuse" | "delete" | null
  >(null);
  const [pendingRemoval, setPendingRemoval] =
    useState<ShoppingListItem | null>(null);
  const [pendingListDeletion, setPendingListDeletion] = useState(false);
  const canShowReadyToShop =
    Boolean(authUser) && canActivateList(listStatus);
  const isReadyToShopDisabled = items.length === 0 || isLoading;
  const draftTitle = listName.trim() || listTitle;
  const isActiveList = listStatus === LIST_STATUS.ACTIVE;
  const isCompletedList = listStatus === LIST_STATUS.COMPLETED;
  const showDetailActions =
    Boolean(authUser) && Boolean(listId) && (isActiveList || isCompletedList);
  const isActionsDisabled = isLoading || detailActionLoading !== null;
  const canEditTitle =
    listStatus === LIST_STATUS.LOCAL_DRAFT || listStatus === LIST_STATUS.DRAFT;

  const handleRehydrate = useCallback(
    (draft: AutosaveDraftInput) => {
      const restoredTitle =
        draft.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE;
      const restoredItems = adaptShoppingListItems(draft.items);

      setItems(restoredItems);
      setListName(draft.title);
      setListTitle(restoredTitle);
    },
    [setItems],
  );

  const handleAutoRestore = useCallback(
    (draft: AutosaveDraftInput) => {
      const restoredTitle =
        draft.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE;
      showToast({
        message: UI_TEXT.SHOPPING_LIST.AUTOSAVE_RECOVERY.RESTORED_TOAST_MESSAGE,
        productName: restoredTitle,
        thumbnail: null,
      });
    },
    [showToast],
  );

  useAutosaveDraft(
    { title: draftTitle, items },
    {
      enabled: Boolean(authUser),
      onRehydrate: handleRehydrate,
    },
  );

  const {
    conflict,
    hasPendingConflict,
    handleUpdateFromServerFirst,
    handleKeepLocalDraft,
  } = useAutosaveRecovery({
    enabled: Boolean(authUser),
    onRehydrate: handleRehydrate,
    onAutoRestore: handleAutoRestore,
    onKeepLocalConflict: () => {
      setListStatus(LIST_STATUS.DRAFT);
    },
  });

  const handleClose = () => {
    setPendingRemoval(null);
    setPendingListDeletion(false);
    onClose();
  };

  const handleAddMore = () => {
    handleClose();
    onAddMoreProducts?.();
  };

  const sortedItems = useMemo<ShoppingListItem[]>(
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
      showToast({
        message: UI_TEXT.SHOPPING_LIST.TOAST_REMOVED_MESSAGE,
        productName: pendingRemoval.name,
        thumbnail: pendingRemoval.thumbnail ?? null,
      });
      setPendingRemoval(null);
    } catch (error) {
      console.warn("No se pudo eliminar el item.", error);
    }
  };

  const handleReuseList = () => {
    if (!listId) {
      return;
    }

    setDetailActionLoading("reuse");
    reuseList(listId)
      .then((response) => {
        setItems(response.items);
        setListId(response.id);
        setListStatus(LIST_STATUS.DRAFT);
        setListTitle(
          response.title.trim() || UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE,
        );
        setListName(response.title);
      })
      .catch((error) => {
        console.warn("No se pudo reusar la lista.", error);
      })
      .finally(() => {
        setDetailActionLoading(null);
      });
  };

  const handleConfirmDeleteList = () => {
    if (!listId) {
      return;
    }

    setDetailActionLoading("delete");
    deleteList(listId)
      .then(() => {
        setItems([]);
        setListId(null);
        setListStatus(LIST_STATUS.LOCAL_DRAFT);
        setListTitle(UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE);
        setListName("");
        setPendingListDeletion(false);
        onClose();
      })
      .catch((error) => {
        console.warn("No se pudo borrar la lista.", error);
      })
      .finally(() => {
        setDetailActionLoading(null);
      });
  };

  const handleResetToEmptyLocalDraft = useCallback(() => {
    setItems([]);
    setListId(null);
    setListStatus(LIST_STATUS.LOCAL_DRAFT);
    setListName("");
    setListTitle(UI_TEXT.SHOPPING_LIST.DEFAULT_LIST_TITLE);
    saveLocalDraft({
      title: "",
      items: [],
    });
  }, [setItems]);

  const handleTitleSubmit = useCallback((nextTitle: string) => {
    setListName(nextTitle);
    setListTitle(nextTitle);
  }, []);

  const handleReadyToShop = useCallback(async () => {
    if (!authUser || !canActivateList(listStatus)) {
      return;
    }

    try {
      await activateList({
        status: listStatus,
        listId,
      });
      showToast({
        message: UI_TEXT.LIST_MODAL.READY_TO_SHOP_TOAST_MESSAGE,
        productName: listTitle,
        thumbnail: null,
      });
      handleResetToEmptyLocalDraft();
      handleClose();
      onAddMoreProducts?.();
    } catch (error) {
      console.warn("No se pudo activar la lista.", error);
    }
  }, [
    authUser,
    handleClose,
    handleResetToEmptyLocalDraft,
    listId,
    listStatus,
    listTitle,
    onAddMoreProducts,
    showToast,
  ]);

  return (
    <ListModal
      isOpen={isOpen}
      onClose={handleClose}
      title={listTitle}
      onTitleSubmit={canEditTitle ? handleTitleSubmit : undefined}
      onReadyToShop={canShowReadyToShop ? handleReadyToShop : undefined}
      itemCount={sortedItems.length}
      isReadyToShopDisabled={isReadyToShopDisabled}
    >
      {hasPendingConflict ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {UI_TEXT.SHOPPING_LIST.AUTOSAVE_CONFLICT.PENDING_SYNC_MESSAGE}
        </div>
      ) : null}
      <ShoppingListListView
        showDetailActions={showDetailActions}
        isActiveList={isActiveList}
        onReuse={handleReuseList}
        onDelete={() => setPendingListDeletion(true)}
        isActionsDisabled={isActionsDisabled}
        detailActionLoading={detailActionLoading}
        isLoading={isLoading}
        sortedItems={sortedItems}
        isReadOnlyMobile={false}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        onRemove={handleRemoveRequest}
        total={total}
        onAddMore={handleAddMore}
      />
      <AutosaveConflictModal
        isOpen={Boolean(conflict)}
        onUpdateFirst={handleUpdateFromServerFirst}
        onKeepLocal={handleKeepLocalDraft}
      />
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
      <DeleteListConfirmation
        isOpen={pendingListDeletion}
        listTitle={listTitle}
        onCancel={() => setPendingListDeletion(false)}
        onConfirm={handleConfirmDeleteList}
      />
    </ListModal>
  );
};

export default ShoppingList;
