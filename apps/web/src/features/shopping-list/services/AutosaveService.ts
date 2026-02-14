import type {
  AutosaveDraft,
  AutosaveDraftInput,
  AutosaveSummary,
  LocalDraft,
} from "./types";
import {
  adaptAutosaveResponse,
  adaptAutosaveSummaryResponse,
} from "./adapters/AutosaveAdapter";


export class AutosaveConflictError extends Error {
  constructor(message = DEFAULT_AUTOSAVE_ERROR_MESSAGE) {
    super(message);
    this.name = "AutosaveConflictError";
  }
}
const LOCAL_DRAFT_STORAGE_KEY = "lists.localDraft";
const LOCAL_DRAFT_SYNC_STORAGE_KEY = "lists.localDraftSync";
const AUTOSAVE_ENDPOINT = "/api/lists/autosave";
const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1500;
const DEFAULT_AUTOSAVE_ERROR_MESSAGE = "Unable to save autosave.";

type AutosaveServiceOptions = {
  errorMessage?: string;
};


type TimestampTrace = {
  raw: string | null;
  utc: string | null;
  local: string | null;
  timezoneOffsetMinutes: number | null;
};

const toTimestampTrace = (value: string | null): TimestampTrace => {
  if (!value) {
    return {
      raw: null,
      utc: null,
      local: null,
      timezoneOffsetMinutes: null,
    };
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {
      raw: value,
      utc: null,
      local: null,
      timezoneOffsetMinutes: null,
    };
  }

  return {
    raw: value,
    utc: date.toISOString(),
    local: date.toString(),
    timezoneOffsetMinutes: date.getTimezoneOffset(),
  };
};

const logBaseUpdatedAtTrace = (
  source: "local-metadata" | "remote-autosave" | "local-fallback-now" | "remote-autosave-error" | "put-payload" | "put-response",
  payload: Record<string, unknown>,
) => {
  console.info("Autosave baseUpdatedAt trace", {
    source,
    ...payload,
  });
};

type AutosaveSyncMetadata = {
  baseUpdatedAt: string | null;
};

const loadAutosaveSyncMetadata = (): AutosaveSyncMetadata => {
  try {
    const stored = localStorage.getItem(LOCAL_DRAFT_SYNC_STORAGE_KEY);

    if (!stored) {
      return { baseUpdatedAt: null };
    }

    const parsed = JSON.parse(stored) as Partial<AutosaveSyncMetadata>;

    if (typeof parsed.baseUpdatedAt === "string") {
      return { baseUpdatedAt: parsed.baseUpdatedAt };
    }

    return { baseUpdatedAt: null };
  } catch (error) {
    console.warn("No se pudo recuperar el estado de sincronización local.", error);
    return { baseUpdatedAt: null };
  }
};

const saveAutosaveSyncMetadata = (metadata: AutosaveSyncMetadata): void => {
  try {
    localStorage.setItem(
      LOCAL_DRAFT_SYNC_STORAGE_KEY,
      JSON.stringify(metadata)
    );
  } catch (error) {
    console.warn("No se pudo guardar el estado de sincronización local.", error);
  }
};

const updateAutosaveSyncMetadata = (updatedAt?: string): void => {
  if (!updatedAt) {
    return;
  }

  saveAutosaveSyncMetadata({
    baseUpdatedAt: updatedAt,
  });
};

export const saveLocalDraft = (draft: AutosaveDraftInput): void => {
  try {
    const storedDraft: LocalDraft = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(
      LOCAL_DRAFT_STORAGE_KEY,
      JSON.stringify(storedDraft)
    );
  } catch (error) {
    console.warn("No se pudo guardar el borrador local.", error);
  }
};

export const loadLocalDraft = (): LocalDraft | null => {
  try {
    const stored = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as LocalDraft;
    if (typeof parsed.updatedAt === "string") {
      return parsed;
    }

    return {
      ...parsed,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("No se pudo recuperar el borrador local.", error);
    return null;
  }
};

export const clearLocalDraft = (): void => {
  try {
    localStorage.removeItem(LOCAL_DRAFT_STORAGE_KEY);
  } catch (error) {
    console.warn("No se pudo eliminar el borrador local.", error);
  }
};

export const getAutosave = async (
  options: AutosaveServiceOptions = {}
): Promise<AutosaveDraft | null> => {
  const response = await fetch(AUTOSAVE_ENDPOINT, {
    credentials: "include",
  });

  if (response.status === 204) {
    return null;
  }

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load autosave.");
  }

  const payload = await response.json();
  const autosaveDraft = adaptAutosaveResponse(payload);

  updateAutosaveSyncMetadata(autosaveDraft?.updatedAt);

  return autosaveDraft;
};


const resolveBaseUpdatedAt = async (
  options: AutosaveServiceOptions,
): Promise<string> => {
  const localBaseUpdatedAt = loadAutosaveSyncMetadata().baseUpdatedAt;
  if (localBaseUpdatedAt) {
    logBaseUpdatedAtTrace("local-metadata", {
      baseUpdatedAt: toTimestampTrace(localBaseUpdatedAt),
    });
    return localBaseUpdatedAt;
  }

  try {
    const remoteDraft = await getAutosave(options);
    if (remoteDraft?.updatedAt) {
      logBaseUpdatedAtTrace("remote-autosave", {
        baseUpdatedAt: toTimestampTrace(remoteDraft.updatedAt),
      });
      return remoteDraft.updatedAt;
    }
  } catch (error) {
    logBaseUpdatedAtTrace("remote-autosave-error", {
      message: error instanceof Error ? error.message : String(error),
    });
    console.warn("No se pudo inicializar baseUpdatedAt desde autosave remoto.", error);
  }

  const now = new Date().toISOString();
  logBaseUpdatedAtTrace("local-fallback-now", {
    baseUpdatedAt: toTimestampTrace(now),
  });

  return now;
};

export const putAutosave = async (
  draft: AutosaveDraftInput,
  options: AutosaveServiceOptions = {}
): Promise<AutosaveSummary> => {
  const baseUpdatedAt = await resolveBaseUpdatedAt(options);
  logBaseUpdatedAtTrace("put-payload", {
    baseUpdatedAt: toTimestampTrace(baseUpdatedAt),
  });

  const response = await fetch(AUTOSAVE_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      ...draft,
      baseUpdatedAt,
    }),
  });

  if (!response.ok) {
    let responseBody: string | null = null;

    try {
      responseBody = await response.text();
    } catch (error) {
      console.warn("No se pudo leer el cuerpo del error de autosave.", error);
    }

    console.warn("Autosave remoto falló.", {
      status: response.status,
      statusText: response.statusText,
      responseBody,
      draft,
    });

    if (response.status === 409) {
      throw new AutosaveConflictError(
        options.errorMessage ?? DEFAULT_AUTOSAVE_ERROR_MESSAGE
      );
    }

    throw new Error(options.errorMessage ?? DEFAULT_AUTOSAVE_ERROR_MESSAGE);
  }

  const payload = await response.json();
  const autosaveSummary = adaptAutosaveSummaryResponse(payload);

  logBaseUpdatedAtTrace("put-response", {
    remoteUpdatedAt: toTimestampTrace(autosaveSummary.updatedAt),
  });

  updateAutosaveSyncMetadata(autosaveSummary.updatedAt);

  return autosaveSummary;
};

export const deleteAutosave = async (
  options: AutosaveServiceOptions = {}
): Promise<void> => {
  const response = await fetch(AUTOSAVE_ENDPOINT, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to delete autosave.");
  }

  saveAutosaveSyncMetadata({ baseUpdatedAt: null });
};

type AutosaveScheduler = {
  schedule: (draft: AutosaveDraftInput) => void;
  cancel: () => void;
};

export const createAutosaveScheduler = (
  options: { debounceMs?: number; persistLocal?: boolean } = {}
): AutosaveScheduler => {
  const debounceMs = options.debounceMs ?? DEFAULT_AUTOSAVE_DEBOUNCE_MS;
  const persistLocal = options.persistLocal ?? true;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let latestDraft: AutosaveDraftInput | null = null;

  const schedule = (draft: AutosaveDraftInput) => {
    latestDraft = draft;
    if (persistLocal) {
      saveLocalDraft(draft);
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      if (latestDraft) {
        void putAutosave(latestDraft);
      }
    }, debounceMs);
  };

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { schedule, cancel };
};
