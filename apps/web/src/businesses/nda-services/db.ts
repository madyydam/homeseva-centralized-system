import {
  SecurityGuardItem,
  ClientFacilitySiteItem,
  SecurityIncidentLogItem,
  NdaServicesData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_nda_services_main';

export class NdaServicesDatabase {
  private syncClient: WorkspaceSyncClient<NdaServicesData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<NdaServicesData>(
      'nda-services',
      DB_STORAGE_PREFIX,
      {
        guards: [],
        clientSites: [],
        incidents: [],
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

  getData(): NdaServicesData {
    return this.syncClient.getData();
  }

  addGuard(guard: SecurityGuardItem) {
    this.syncClient.setData((current) => {
      current.guards.unshift(guard);
    });
  }

  addClientSite(site: ClientFacilitySiteItem) {
    this.syncClient.setData((current) => {
      current.clientSites.unshift(site);
    });
  }

  addIncident(incident: SecurityIncidentLogItem) {
    this.syncClient.setData((current) => {
      current.incidents.unshift(incident);
    });
  }
}

export const ndaServicesDb = new NdaServicesDatabase();
