import type { CatalogCache } from "../domain/catalogCache";

type CacheEntry = {
  value: unknown;
  expiresAt: number;
};

export class InMemoryCatalogCache implements CatalogCache {
  private readonly store = new Map<string, CacheEntry>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      return null;
    }

    return entry.value as T;
  }

  getStale<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }
}
