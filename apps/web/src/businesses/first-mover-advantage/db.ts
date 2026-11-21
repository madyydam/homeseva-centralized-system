import {
  SaasTenantItem,
  ApiKeyItem,
  AppBuildJobItem,
  FirstMoverAdvantageData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_fma_saas_main';

export class FirstMoverAdvantageDatabase {
  private syncClient: WorkspaceSyncClient<FirstMoverAdvantageData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<FirstMoverAdvantageData>(
      'first-mover-advantage',
      DB_STORAGE_PREFIX,
      {
        tenants: [],
        apiKeys: [],
        builds: [],
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

  getData(): FirstMoverAdvantageData {
    return this.syncClient.getData();
  }

  addTenant(tenant: SaasTenantItem) {
    this.syncClient.setData((current) => {
      current.tenants.unshift(tenant);
    });
  }

  addApiKey(key: ApiKeyItem) {
    this.syncClient.setData((current) => {
      current.apiKeys.unshift(key);
    });
  }

  addBuildJob(build: AppBuildJobItem) {
    this.syncClient.setData((current) => {
      current.builds.unshift(build);
    });
  }
}

export const firstMoverAdvantageDb = new FirstMoverAdvantageDatabase();
