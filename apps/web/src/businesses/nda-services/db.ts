import {
  SecurityGuardItem,
  ClientFacilitySiteItem,
  SecurityIncidentLogItem,
  NdaServicesData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_nda_services_';

export class NdaServicesDatabase {
  private inMemoryCache: NdaServicesData = {
    guards: [],
    clientSites: [],
    incidents: [],
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

  getData(): NdaServicesData {
    return this.inMemoryCache;
  }

  addGuard(guard: SecurityGuardItem) {
    this.inMemoryCache.guards.unshift(guard);
    this.persist();
  }

  addClientSite(site: ClientFacilitySiteItem) {
    this.inMemoryCache.clientSites.unshift(site);
    this.persist();
  }

  addIncident(incident: SecurityIncidentLogItem) {
    this.inMemoryCache.incidents.unshift(incident);
    this.persist();
  }
}

export const ndaServicesDb = new NdaServicesDatabase();

