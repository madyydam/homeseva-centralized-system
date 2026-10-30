import {
  ProjectSiteItem,
  BOQItem,
  LaborRosterItem,
  MilestoneBillItem,
  PrefabConstructionData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_prefab_construction_';

export class PrefabConstructionDatabase {
  private inMemoryCache: PrefabConstructionData = {
    sites: [],
    boqList: [],
    laborRoster: [],
    milestoneBills: [],
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

  getData(): PrefabConstructionData {
    return this.inMemoryCache;
  }

  addSite(site: ProjectSiteItem) {
    this.inMemoryCache.sites.unshift(site);
    this.persist();
  }

  advanceSiteStage(siteId: string) {
    const STAGES: ProjectSiteItem['stage'][] = [
      'Foundation & Earthwork',
      'Steel Frame Erection',
      'Wall Panels Installation',
      'MEP & Finishing',
      'Handover & Audit',
    ];
    this.inMemoryCache.sites = this.inMemoryCache.sites.map((s) => {
      if (s.id !== siteId) return s;
      const idx = STAGES.indexOf(s.stage);
      const nextStage = idx < STAGES.length - 1 ? STAGES[idx + 1]! : s.stage;
      return { ...s, stage: nextStage };
    });
    this.persist();
  }

  addBOQItem(item: BOQItem) {
    this.inMemoryCache.boqList.unshift(item);
    this.persist();
  }

  updateReceivedBOQ(itemId: string, addQty: number) {
    this.inMemoryCache.boqList = this.inMemoryCache.boqList.map((i) => {
      if (i.id !== itemId) return i;
      return { ...i, quantityReceived: i.quantityReceived + addQty };
    });
    this.persist();
  }

  addLaborWorker(worker: LaborRosterItem) {
    this.inMemoryCache.laborRoster.unshift(worker);
    this.persist();
  }

  updateLaborStatus(workerId: string, status: LaborRosterItem['attendanceStatus']) {
    this.inMemoryCache.laborRoster = this.inMemoryCache.laborRoster.map((w) =>
      w.id === workerId ? { ...w, attendanceStatus: status } : w
    );
    this.persist();
  }

  addMilestoneBill(bill: MilestoneBillItem) {
    this.inMemoryCache.milestoneBills.unshift(bill);
    this.persist();
  }

  certifyMilestoneBill(billId: string) {
    this.inMemoryCache.milestoneBills = this.inMemoryCache.milestoneBills.map((b) =>
      b.id === billId ? { ...b, status: 'Certified by Engineer' } : b
    );
    this.persist();
  }
}

export const prefabConstructionDb = new PrefabConstructionDatabase();

