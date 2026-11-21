import {
  PropertyUnitItem,
  TenantLeaseAgreementItem,
  RentReceiptItem,
  HsRealEstateData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_hs_real_estate_main';

export class HsRealEstateDatabase {
  private syncClient: WorkspaceSyncClient<HsRealEstateData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<HsRealEstateData>(
      'hs-real-estate',
      DB_STORAGE_PREFIX,
      {
        properties: [],
        leases: [],
        receipts: [],
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

  getData(): HsRealEstateData {
    return this.syncClient.getData();
  }

  addProperty(property: PropertyUnitItem) {
    this.syncClient.setData((current) => {
      current.properties.unshift(property);
    });
  }

  addLease(lease: TenantLeaseAgreementItem) {
    this.syncClient.setData((current) => {
      current.leases.unshift(lease);
      current.properties = current.properties.map((p) =>
        p.propertyCode === lease.propertyCode
          ? { ...p, occupancyStatus: 'Leased', tenantName: lease.tenantName }
          : p
      );
    });
  }

  addReceipt(receipt: RentReceiptItem) {
    this.syncClient.setData((current) => {
      current.receipts.unshift(receipt);
    });
  }
}

export const hsRealEstateDb = new HsRealEstateDatabase();
