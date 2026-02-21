export type ListTabSyncEvent = {
  type: "list-activated";
  timestamp: number;
  sourceTabId: string;
};

export const LIST_TAB_SYNC_KEY = "lists.tabSync";
const LIST_TAB_SYNC_CHANNEL = "lists";

type PublishListTabSyncEventInput = {
  type: ListTabSyncEvent["type"];
  sourceTabId: string;
};

type SubscribeToListTabSyncEventsInput = {
  sourceTabId: string;
  onListActivated: () => void;
};

const parseListTabSyncEvent = (value: string): ListTabSyncEvent | null => {
  try {
    const parsed = JSON.parse(value) as Partial<ListTabSyncEvent>;

    if (
      parsed.type !== "list-activated" ||
      typeof parsed.sourceTabId !== "string" ||
      typeof parsed.timestamp !== "number"
    ) {
      return null;
    }

    return {
      type: parsed.type,
      sourceTabId: parsed.sourceTabId,
      timestamp: parsed.timestamp,
    };
  } catch {
    return null;
  }
};

export const publishListTabSyncEvent = ({
  type,
  sourceTabId,
}: PublishListTabSyncEventInput): void => {
  const event: ListTabSyncEvent = {
    type,
    sourceTabId,
    timestamp: Date.now(),
  };

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(LIST_TAB_SYNC_CHANNEL);
    channel.postMessage(event);
    channel.close();
    return;
  }

  localStorage.setItem(LIST_TAB_SYNC_KEY, JSON.stringify(event));
};

export const subscribeToListTabSyncEvents = ({
  sourceTabId,
  onListActivated,
}: SubscribeToListTabSyncEventsInput): (() => void) => {
  const onSyncEvent = (event: ListTabSyncEvent) => {
    if (event.sourceTabId === sourceTabId) {
      return;
    }

    if (event.type === "list-activated") {
      onListActivated();
    }
  };

  const onStorage = (storageEvent: StorageEvent) => {
    if (storageEvent.key !== LIST_TAB_SYNC_KEY || !storageEvent.newValue) {
      return;
    }

    const syncEvent = parseListTabSyncEvent(storageEvent.newValue);

    if (!syncEvent) {
      return;
    }

    onSyncEvent(syncEvent);
  };

  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(LIST_TAB_SYNC_CHANNEL);
    const onMessage = (messageEvent: MessageEvent<ListTabSyncEvent>) => {
      onSyncEvent(messageEvent.data);
    };

    channel.addEventListener("message", onMessage as EventListener);

    return () => {
      channel.removeEventListener("message", onMessage as EventListener);
      channel.close();
    };
  }

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
  };
};

export const createListTabId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `tab-${Date.now()}`;
};
