import { afterEach, beforeAll, beforeEach } from "vitest";

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length(): number {
    return this.store.size;
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
}

let canonicalStorage: MemoryStorage | null = null;

const installStorage = (storage: Storage): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
      writable: true,
    });
  } catch {
    (window as { localStorage: Storage }).localStorage = storage;
  }

  try {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
      writable: true,
    });
  } catch {
    (globalThis as { localStorage: Storage }).localStorage = storage;
  }
};

beforeAll(() => {
  if (typeof window !== "undefined") {
    canonicalStorage = new MemoryStorage();
    installStorage(canonicalStorage);
  }
});

beforeEach(() => {
  canonicalStorage?.clear();

  if (canonicalStorage) {
    installStorage(canonicalStorage);
  }
});

afterEach(() => {
  canonicalStorage?.clear();

  if (canonicalStorage) {
    installStorage(canonicalStorage);
  }
});
