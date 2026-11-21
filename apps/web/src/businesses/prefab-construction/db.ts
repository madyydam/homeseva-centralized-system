import {
  ProjectSiteItem,
  BOQItem,
  LaborRosterItem,
  MilestoneBillItem,
  PrefabConstructionData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_prefab_construction_main';

export class PrefabConstructionDatabase {
  private syncClient: WorkspaceSyncClient<PrefabConstructionData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<PrefabConstructionData>(
      'prefab-construction',
      DB_STORAGE_PREFIX,
      {
        sites: [],
        boqList: [],
        laborRoster: [],
        milestoneBills: [],
      }
    );
  }

  subscribe(callback: () => void): () => void {
    return this.syncClient.subscribe(callback);
  }

  syncFromRemote(): Promise<void> {
    return this.syncClient.syncFromRemote();
  }

  pushToRemote(): Promise<void> {
    return this.syncClient.pushToRemote();
  }

  getData(): PrefabConstructionData {
    return this.syncClient.getData();
  }

  addSite(site: ProjectSiteItem) {
    this.syncClient.setData((current) => {
      current.sites.unshift(site);
    });
  }

  advanceSiteStage(siteId: string) {
    const STAGES: ProjectSiteItem['stage'][] = [
      'Foundation & Earthwork',
      'Steel Frame Erection',
      'Wall Panels Installation',
      'MEP & Finishing',
      'Handover & Audit',
    ];
    this.syncClient.setData((current) => {
      current.sites = current.sites.map((s) => {
        if (s.id !== siteId) return s;
        const idx = STAGES.indexOf(s.stage);
        const nextStage = idx < STAGES.length - 1 ? STAGES[idx + 1]! : s.stage;
        return { ...s, stage: nextStage };
      });
    });
  }

  addBOQItem(item: BOQItem) {
    this.syncClient.setData((current) => {
      current.boqList.unshift(item);
    });
  }

  updateReceivedBOQ(itemId: string, addQty: number) {
    this.syncClient.setData((current) => {
      current.boqList = current.boqList.map((i) => {
        if (i.id !== itemId) return i;
        return { ...i, quantityReceived: i.quantityReceived + addQty };
      });
    });
  }

  addLaborWorker(worker: LaborRosterItem) {
    this.syncClient.setData((current) => {
      current.laborRoster.unshift(worker);
    });
  }

  updateLaborStatus(workerId: string, status: LaborRosterItem['attendanceStatus']) {
    this.syncClient.setData((current) => {
      current.laborRoster = current.laborRoster.map((w) =>
        w.id === workerId ? { ...w, attendanceStatus: status } : w
      );
    });
  }

  addMilestoneBill(bill: MilestoneBillItem) {
    this.syncClient.setData((current) => {
      current.milestoneBills.unshift(bill);
    });
  }

  certifyMilestoneBill(billId: string) {
    this.syncClient.setData((current) => {
      current.milestoneBills = current.milestoneBills.map((b) =>
        b.id === billId ? { ...b, status: 'Certified by Engineer' } : b
      );
    });
  }
}

export const prefabConstructionDb = new PrefabConstructionDatabase();
