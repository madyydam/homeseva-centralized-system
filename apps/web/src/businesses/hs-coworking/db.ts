import {
  CoworkingMemberItem,
  MeetingRoomBookingItem,
  DayPassItem,
  HsCoworkingData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_hs_coworking_main';

export class HsCoworkingDatabase {
  private syncClient: WorkspaceSyncClient<HsCoworkingData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<HsCoworkingData>(
      'hs-coworking',
      DB_STORAGE_PREFIX,
      {
        members: [],
        roomBookings: [],
        dayPasses: [],
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

  getData(): HsCoworkingData {
    return this.syncClient.getData();
  }

  addMember(member: CoworkingMemberItem) {
    this.syncClient.setData((current) => {
      current.members.unshift(member);
    });
  }

  addRoomBooking(booking: MeetingRoomBookingItem) {
    this.syncClient.setData((current) => {
      current.roomBookings.unshift(booking);
    });
  }

  addDayPass(pass: DayPassItem) {
    this.syncClient.setData((current) => {
      current.dayPasses.unshift(pass);
    });
  }
}

export const hsCoworkingDb = new HsCoworkingDatabase();
