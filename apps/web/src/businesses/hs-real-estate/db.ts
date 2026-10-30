import {
  PropertyUnitItem,
  TenantLeaseAgreementItem,
  RentReceiptItem,
  HsRealEstateData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_hs_real_estate_';

export class HsRealEstateDatabase {
  private inMemoryCache: HsRealEstateData = {
    properties: [],
    leases: [],
    receipts: [],
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

  getData(): HsRealEstateData {
    return this.inMemoryCache;
  }

  addProperty(property: PropertyUnitItem) {
    this.inMemoryCache.properties.unshift(property);
    this.persist();
  }

  addLease(lease: TenantLeaseAgreementItem) {
    this.inMemoryCache.leases.unshift(lease);
    this.inMemoryCache.properties = this.inMemoryCache.properties.map((p) =>
      p.propertyCode === lease.propertyCode ? { ...p, occupancyStatus: 'Leased', tenantName: lease.tenantName } : p
    );
    this.persist();
  }

  addReceipt(receipt: RentReceiptItem) {
    this.inMemoryCache.receipts.unshift(receipt);
    this.persist();
  }
}

export const hsRealEstateDb = new HsRealEstateDatabase();

