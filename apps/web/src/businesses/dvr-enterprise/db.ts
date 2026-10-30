import {
  TradingPurchaseOrderItem,
  TradingSalesOrderItem,
  DvrEnterpriseData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_dvr_enterprise_';

export class DvrEnterpriseDatabase {
  private inMemoryCache: DvrEnterpriseData = {
    purchaseOrders: [],
    salesOrders: [],
  };

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(`${DB_STORAGE_PREFIX}main`) || localStorage.getItem('homeseva_db_dve_enterprises_main');
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

  getData(): DvrEnterpriseData {
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

export const dvrEnterpriseDb = new DvrEnterpriseDatabase();
