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
import { fetchWithAuth } from "@src/shared/services/http/fetchWithAuth";


export class AutosaveConflictError extends Error {
  readonly remoteUpdatedAt: string | null;
  readonly metadata?: Record<string, unknown>;

  constructor({
    message = DEFAULT_AUTOSAVE_ERROR_MESSAGE,
    remoteUpdatedAt = null,
    metadata,
  }: {
    message?: string;
    remoteUpdatedAt?: string | null;
    metadata?: Record<string, unknown>;
  } = {}) {
    super(message);
    this.name = "AutosaveConflictError";
    this.remoteUpdatedAt = remoteUpdatedAt;
    this.metadata = metadata;
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

const saveLocalDraftWithUpdatedAt = (
  draft: AutosaveDraftInput,
  updatedAt: string,
): void => {
  try {
    const storedDraft: LocalDraft = {
      ...draft,
      updatedAt,
    };
    localStorage.setItem(
      LOCAL_DRAFT_STORAGE_KEY,
      JSON.stringify(storedDraft)
    );
  } catch (error) {
    console.warn("No se pudo guardar el borrador local.", error);
  }
};

export const saveLocalDraft = (draft: AutosaveDraftInput): void => {
  saveLocalDraftWithUpdatedAt(draft, new Date().toISOString());
};

export const saveAlignedEmptyLocalDraft = (updatedAt: string): void => {
  saveLocalDraftWithUpdatedAt(
    {
      title: "",
      items: [],
    },
    updatedAt,
  );
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
  const response = await fetchWithAuth(AUTOSAVE_ENDPOINT, {
    method: "GET",
    retryOnAuth401: true,
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


type AutosaveConflictPayload = Record<string, unknown> & {
  remoteUpdatedAt?: string;
};

const parseAutosaveConflictPayload = (
  responseBody: string | null,
): { remoteUpdatedAt: string | null; metadata?: Record<string, unknown> } => {
  if (!responseBody) {
    return { remoteUpdatedAt: null };
  }

  try {
    const payload = JSON.parse(responseBody) as AutosaveConflictPayload;
    const { remoteUpdatedAt, ...metadata } = payload;

    return {
      remoteUpdatedAt: typeof remoteUpdatedAt === "string" ? remoteUpdatedAt : null,
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    };
  } catch {
    return { remoteUpdatedAt: null };
  }
};

const putAutosaveRequest = async (
  draft: AutosaveDraftInput,
  baseUpdatedAt: string,
) =>
  fetchWithAuth(AUTOSAVE_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    retryOnAuth401: true,
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

  const response = await putAutosaveRequest(draft, baseUpdatedAt);


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
      const { remoteUpdatedAt, metadata } = parseAutosaveConflictPayload(
        responseBody,
      );

      if (remoteUpdatedAt) {
        saveAutosaveSyncMetadata({
          baseUpdatedAt: remoteUpdatedAt,
          sourceTabId: options.sourceTabId,
        });
      }

      throw new AutosaveConflictError({
        message: options.errorMessage ?? DEFAULT_AUTOSAVE_ERROR_MESSAGE,
        remoteUpdatedAt,
        metadata,
      });
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
  const response = await fetchWithAuth(AUTOSAVE_ENDPOINT, {
    method: "DELETE",
    retryOnAuth401: true,
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

const executeAutosaveWithConflictRecovery = async (
  draft: AutosaveDraftInput,
  options: {
    sourceTabId?: string;
  },
): Promise<void> => {
  try {
    await putAutosave(draft, { sourceTabId: options.sourceTabId });
  } catch (error) {
    if (error instanceof AutosaveConflictError) {
      try {
        await putAutosave(draft, { sourceTabId: options.sourceTabId });
        return;
      } catch (retryError) {
        console.warn(
          "No se pudo reintentar autosave tras conflicto de versión.",
          retryError,
        );
        return;
      }
    }

    console.warn("No se pudo sincronizar autosave remoto.", error);
  }
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
        void executeAutosaveWithConflictRecovery(latestDraft, {
          sourceTabId: options.sourceTabId,
        });
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
