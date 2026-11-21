import {
  TradingPurchaseOrderItem,
  TradingSalesOrderItem,
  DvrEnterpriseData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_dvr_enterprise_main';

export class DvrEnterpriseDatabase {
  private syncClient: WorkspaceSyncClient<DvrEnterpriseData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<DvrEnterpriseData>(
      'dvr-enterprise',
      DB_STORAGE_PREFIX,
      {
        purchaseOrders: [],
        salesOrders: [],
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

  getData(): DvrEnterpriseData {
    return this.syncClient.getData();
  }

  addPurchaseOrder(po: TradingPurchaseOrderItem) {
    this.syncClient.setData((current) => {
      current.purchaseOrders.unshift(po);
    });
  }

  addSalesOrder(order: TradingSalesOrderItem) {
    this.syncClient.setData((current) => {
      current.salesOrders.unshift(order);
    });
  }
}

export const dvrEnterpriseDb = new DvrEnterpriseDatabase();
