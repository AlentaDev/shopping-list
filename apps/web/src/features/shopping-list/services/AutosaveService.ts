import type { AutosaveDraft, AutosaveDraftInput, AutosaveSummary } from "./types";
import {
  adaptAutosaveResponse,
  adaptAutosaveSummaryResponse,
} from "./adapters/AutosaveAdapter";

const LOCAL_DRAFT_STORAGE_KEY = "lists.localDraft";
const AUTOSAVE_ENDPOINT = "/api/lists/autosave";
const DEFAULT_AUTOSAVE_DEBOUNCE_MS = 1500;

type AutosaveServiceOptions = {
  errorMessage?: string;
};

export const saveLocalDraft = (draft: AutosaveDraftInput): void => {
  try {
    localStorage.setItem(LOCAL_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn("No se pudo guardar el borrador local.", error);
  }
};

export const loadLocalDraft = (): AutosaveDraftInput | null => {
  try {
    const stored = localStorage.getItem(LOCAL_DRAFT_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    return JSON.parse(stored) as AutosaveDraftInput;
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

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to load autosave.");
  }

  const payload = await response.json();

  return adaptAutosaveResponse(payload);
};

export const putAutosave = async (
  draft: AutosaveDraftInput,
  options: AutosaveServiceOptions = {}
): Promise<AutosaveSummary> => {
  const response = await fetch(AUTOSAVE_ENDPOINT, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error(options.errorMessage ?? "Unable to save autosave.");
  }

  const payload = await response.json();

  return adaptAutosaveSummaryResponse(payload);
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
