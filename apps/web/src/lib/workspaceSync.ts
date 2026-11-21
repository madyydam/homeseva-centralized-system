/**
 * Generic workspace synchronization client for multi-tenant business modules.
 * Connects zero-latency in-memory caching and browser localStorage with authoritative PostgreSQL persistence.
 */
export class WorkspaceSyncClient<T extends Record<string, any>> {
  private inMemoryCache: T;
  private storageKey: string;
  private businessSlug: string;
  private isPushing = false;
  private subscribers: Array<() => void> = [];

  constructor(businessSlug: string, storageKey: string, initialData: T) {
    this.businessSlug = businessSlug;
    this.storageKey = storageKey;
    this.inMemoryCache = { ...initialData };
    this.hydrateFromStorage();
    if (typeof window !== 'undefined') {
      this.syncFromRemote();
    }
  }

  /**
   * Subscribes a listener (e.g. React component refresh callback)
   * to cache updates from remote PostgreSQL hydration.
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch {
        // Safe callback execution
      }
    });
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.inMemoryCache = JSON.parse(raw);
      }
    } catch {
      // Storage fallback
    }
  }

  private persistLocal() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.inMemoryCache));
    } catch {
      // Ignore write errors
    }
  }

  /**
   * Pulls authoritative workspace data from PostgreSQL API.
   * Merges remote data into cache, or seeds PostgreSQL if remote is empty.
   */
  async syncFromRemote(): Promise<void> {
    if (typeof window === 'undefined') return;
    try {
      const res = await fetch(`/api/business/${this.businessSlug}/sync?section=main`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const remoteData = json.data;
          const hasRemoteData = Object.values(remoteData).some(
            (v: any) =>
              (Array.isArray(v) && v.length > 0) ||
              (v && typeof v === 'object' && Object.keys(v).length > 0)
          );
          const hasLocalData = Object.values(this.inMemoryCache).some(
            (v: any) =>
              (Array.isArray(v) && v.length > 0) ||
              (v && typeof v === 'object' && Object.keys(v).length > 0)
          );

          if (hasRemoteData) {
            this.inMemoryCache = { ...this.inMemoryCache, ...remoteData };
            this.persistLocal();
            this.notify();
          } else if (hasLocalData) {
            await this.pushToRemote();
          }
        }
      }
    } catch {
      // Offline fallback: keep local inMemoryCache
    }
  }

  /**
   * Pushes current workspace snapshot to PostgreSQL.
   */
  async pushToRemote(): Promise<void> {
    if (typeof window === 'undefined' || this.isPushing) return;
    this.isPushing = true;
    try {
      await fetch(`/api/business/${this.businessSlug}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: 'main', data: this.inMemoryCache }),
      });
    } catch {
      // Fail silently, data is safely saved in localStorage
    } finally {
      this.isPushing = false;
    }
  }

  getData(): T {
    return this.inMemoryCache;
  }

  setData(updater: (prev: T) => T | void) {
    const updated = updater(this.inMemoryCache);
    if (updated !== undefined) {
      this.inMemoryCache = updated;
    }
    this.persistLocal();
    this.notify();
    this.pushToRemote();
  }
}
