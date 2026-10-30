import {
  TradingPurchaseOrderItem,
  TradingSalesOrderItem,
  DveEnterprisesData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_dve_enterprises_';

export class DveEnterprisesDatabase {
  private inMemoryCache: DveEnterprisesData = {
    purchaseOrders: [],
    salesOrders: [],
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

  getData(): DveEnterprisesData {
    return this.inMemoryCache;
  }

  addPurchaseOrder(po: TradingPurchaseOrderItem) {
    this.inMemoryCache.purchaseOrders.unshift(po);
    this.persist();
  }

  addSalesOrder(order: TradingSalesOrderItem) {
    this.inMemoryCache.salesOrders.unshift(order);
    this.persist();
  }
}

export const dveEnterprisesDb = new DveEnterprisesDatabase();

