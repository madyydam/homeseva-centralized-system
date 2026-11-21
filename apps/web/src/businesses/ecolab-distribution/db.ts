import {
  ChemicalProductItem,
  InstitutionalAccountItem,
  DispatchOrderItem,
  EcolabDistributionData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_ecolab_distribution_main';

export class EcolabDistributionDatabase {
  private syncClient: WorkspaceSyncClient<EcolabDistributionData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<EcolabDistributionData>(
      'ecolab-distribution',
      DB_STORAGE_PREFIX,
      {
        chemicals: [],
        accounts: [],
        dispatches: [],
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

  getData(): EcolabDistributionData {
    return this.syncClient.getData();
  }

  addChemical(item: ChemicalProductItem) {
    this.syncClient.setData((current) => {
      current.chemicals.unshift(item);
    });
  }

  addAccount(account: InstitutionalAccountItem) {
    this.syncClient.setData((current) => {
      current.accounts.unshift(account);
    });
  }

  addDispatch(dispatch: DispatchOrderItem) {
    this.syncClient.setData((current) => {
      current.dispatches.unshift(dispatch);
    });
  }
}

export const ecolabDistributionDb = new EcolabDistributionDatabase();
