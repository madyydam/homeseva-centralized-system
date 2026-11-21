/**
 * Generic workspace synchronization client for multi-tenant business modules.
 * Connects zero-latency in-memory caching and browser localStorage with authoritative PostgreSQL persistence.
 * Hardened for offline resiliency, internet reconnect auto-recovery, and mobile app lifecycle visibility.
 */
export class WorkspaceSyncClient<T extends Record<string, any>> {
  private inMemoryCache: T;
  private storageKey: string;
  private businessSlug: string;
  private section: string;
  private isPushing = false;
  private pendingPush = false;
  private subscribers: Array<() => void> = [];
  private onlineHandler?: () => void;
  private visibilityHandler?: () => void;

  constructor(businessSlug: string, storageKey: string, initialData: T, section: string = 'main') {
    this.businessSlug = businessSlug;
    this.storageKey = storageKey;
    this.section = section;
    this.inMemoryCache = { ...initialData };
    this.hydrateFromStorage();

    if (typeof window !== 'undefined') {
      this.syncFromRemote();

      // Lifecycle Listener 1: Internet Reconnect Recovery
      this.onlineHandler = () => {
        this.pushToRemote();
        this.syncFromRemote();
      };
      window.addEventListener('online', this.onlineHandler);

      // Lifecycle Listener 2: Mobile / Browser Visibility Recovery
      this.visibilityHandler = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.syncFromRemote();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
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
      const res = await fetch(`/api/business/${this.businessSlug}/sync?section=${encodeURIComponent(this.section)}`, {
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
      // Offline fallback: keep local inMemoryCache safely intact
    }
  }

  /**
   * Pushes current workspace snapshot to PostgreSQL with retry queue.
   */
  async pushToRemote(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (this.isPushing) {
      this.pendingPush = true;
      return;
    }

    this.isPushing = true;
    try {
      const res = await fetch(`/api/business/${this.businessSlug}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: this.section, data: this.inMemoryCache }),
      });

      if (!res.ok) {
        // Queue retry if network/server is temporarily busy
        this.pendingPush = true;
      }
    } catch {
      // Offline / network drop: saved in localStorage, will retry on 'online'
      this.pendingPush = true;
    } finally {
      this.isPushing = false;
      if (this.pendingPush) {
        this.pendingPush = false;
        // Schedule throttled retry after 3 seconds
        setTimeout(() => this.pushToRemote(), 3000);
      }
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

  destroy() {
    if (typeof window !== 'undefined') {
      if (this.onlineHandler) window.removeEventListener('online', this.onlineHandler);
      if (this.visibilityHandler) document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.subscribers = [];
  }
}
