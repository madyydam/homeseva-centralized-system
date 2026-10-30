import {
  SaasTenantItem,
  ApiKeyItem,
  AppBuildJobItem,
  FirstMoverAdvantageData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_fma_saas_';

export class FirstMoverAdvantageDatabase {
  private inMemoryCache: FirstMoverAdvantageData = {
    tenants: [],
    apiKeys: [],
    builds: [],
  };

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`${DB_STORAGE_PREFIX}main`);
      if (raw) {
        this.inMemoryCache = JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${DB_STORAGE_PREFIX}main`, JSON.stringify(this.inMemoryCache));
    } catch {
      // Ignore
    }
  }

  getData(): FirstMoverAdvantageData {
    return this.inMemoryCache;
  }

  addTenant(tenant: SaasTenantItem) {
    this.inMemoryCache.tenants.unshift(tenant);
    this.persist();
  }

  addApiKey(key: ApiKeyItem) {
    this.inMemoryCache.apiKeys.unshift(key);
    this.persist();
  }

  addBuildJob(build: AppBuildJobItem) {
    this.inMemoryCache.builds.unshift(build);
    this.persist();
  }
}

export const firstMoverAdvantageDb = new FirstMoverAdvantageDatabase();

