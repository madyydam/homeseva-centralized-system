import {
  ChemicalProductItem,
  InstitutionalAccountItem,
  DispatchOrderItem,
  EcolabDistributionData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_ecolab_distribution_';

export class EcolabDistributionDatabase {
  private inMemoryCache: EcolabDistributionData = {
    chemicals: [],
    accounts: [],
    dispatches: [],
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
      // Storage fallback
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`${DB_STORAGE_PREFIX}main`, JSON.stringify(this.inMemoryCache));
    } catch {
      // Ignore write errors
    }
  }

  getData(): EcolabDistributionData {
    return this.inMemoryCache;
  }

  addChemical(item: ChemicalProductItem) {
    this.inMemoryCache.chemicals.unshift(item);
    this.persist();
  }

  addAccount(account: InstitutionalAccountItem) {
    this.inMemoryCache.accounts.unshift(account);
    this.persist();
  }

  addDispatch(dispatch: DispatchOrderItem) {
    this.inMemoryCache.dispatches.unshift(dispatch);
    this.persist();
  }
}

export const ecolabDistributionDb = new EcolabDistributionDatabase();

