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
  sourceTabId?: string;
};


type AutosaveSyncMetadata = {
  baseUpdatedAt: string | null;
  sourceTabId?: string;
};

const loadAutosaveSyncMetadata = (): AutosaveSyncMetadata => {
  try {
    const stored = localStorage.getItem(LOCAL_DRAFT_SYNC_STORAGE_KEY);

    if (!stored) {
      return { baseUpdatedAt: null };
    }

    const parsed = JSON.parse(stored) as Partial<AutosaveSyncMetadata>;

    if (typeof parsed.baseUpdatedAt === "string") {
      return {
        baseUpdatedAt: parsed.baseUpdatedAt,
        sourceTabId:
          typeof parsed.sourceTabId === "string" ? parsed.sourceTabId : undefined,
      };
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

const updateAutosaveSyncMetadata = (
  updatedAt?: string,
  sourceTabId?: string,
): void => {
  if (!updatedAt) {
    return;
  }

  saveAutosaveSyncMetadata({
    baseUpdatedAt: updatedAt,
    sourceTabId,
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

  updateAutosaveSyncMetadata(autosaveDraft?.updatedAt, options.sourceTabId);

  return autosaveDraft;
};


const resolveBaseUpdatedAt = async (
  options: AutosaveServiceOptions,
): Promise<string> => {
  const localBaseUpdatedAt = loadAutosaveSyncMetadata().baseUpdatedAt;
  if (localBaseUpdatedAt) {
    return localBaseUpdatedAt;
  }

  try {
    const remoteDraft = await getAutosave(options);
    if (remoteDraft?.updatedAt) {
      return remoteDraft.updatedAt;
    }
  } catch (error) {
    console.warn("No se pudo inicializar baseUpdatedAt desde autosave remoto.", error);
  }

  const now = new Date().toISOString();

  return now;
};


type AutosaveConflictPayload = {
  remoteUpdatedAt?: string;
};

const parseAutosaveConflictRemoteUpdatedAt = (
  responseBody: string | null,
): string | null => {
  if (!responseBody) {
    return null;
  }

  try {
    const payload = JSON.parse(responseBody) as AutosaveConflictPayload;
    return typeof payload.remoteUpdatedAt === "string"
      ? payload.remoteUpdatedAt
      : null;
  } catch {
    return null;
  }
};

const putAutosaveRequest = async (
  draft: AutosaveDraftInput,
  baseUpdatedAt: string,
) =>
  fetch(AUTOSAVE_ENDPOINT, {
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

export const putAutosave = async (
  draft: AutosaveDraftInput,
  options: AutosaveServiceOptions = {}
): Promise<AutosaveSummary> => {
  const baseUpdatedAt = await resolveBaseUpdatedAt(options);

  let response = await putAutosaveRequest(draft, baseUpdatedAt);

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
      const remoteUpdatedAt = parseAutosaveConflictRemoteUpdatedAt(responseBody);

      if (remoteUpdatedAt) {
        saveAutosaveSyncMetadata({
          baseUpdatedAt: remoteUpdatedAt,
          sourceTabId: options.sourceTabId,
        });

        response = await putAutosaveRequest(draft, remoteUpdatedAt);

        if (!response.ok) {
          throw new AutosaveConflictError(
            options.errorMessage ?? DEFAULT_AUTOSAVE_ERROR_MESSAGE
          );
        }
      } else {
        throw new AutosaveConflictError(
          options.errorMessage ?? DEFAULT_AUTOSAVE_ERROR_MESSAGE
        );
      }
    } else {
      throw new Error(options.errorMessage ?? DEFAULT_AUTOSAVE_ERROR_MESSAGE);
    }
  }

  const payload = await response.json();
  const autosaveSummary = adaptAutosaveSummaryResponse(payload);


  updateAutosaveSyncMetadata(autosaveSummary.updatedAt, options.sourceTabId);

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

  saveAutosaveSyncMetadata({
    baseUpdatedAt: null,
    sourceTabId: options.sourceTabId,
  });
};

type AutosaveScheduler = {
  schedule: (draft: AutosaveDraftInput) => void;
  cancel: () => void;
};

export const createAutosaveScheduler = (
  options: {
    debounceMs?: number;
    persistLocal?: boolean;
    sourceTabId?: string;
  } = {}
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
        void putAutosave(latestDraft, { sourceTabId: options.sourceTabId });
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
