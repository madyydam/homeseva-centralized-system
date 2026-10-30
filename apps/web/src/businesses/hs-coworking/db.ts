import {
  CoworkingMemberItem,
  MeetingRoomBookingItem,
  DayPassItem,
  HsCoworkingData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_hs_coworking_';

export class HsCoworkingDatabase {
  private inMemoryCache: HsCoworkingData = {
    members: [],
    roomBookings: [],
    dayPasses: [],
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

  getData(): HsCoworkingData {
    return this.inMemoryCache;
  }

  addMember(member: CoworkingMemberItem) {
    this.inMemoryCache.members.unshift(member);
    this.persist();
  }

  addRoomBooking(booking: MeetingRoomBookingItem) {
    this.inMemoryCache.roomBookings.unshift(booking);
    this.persist();
  }

  addDayPass(pass: DayPassItem) {
    this.inMemoryCache.dayPasses.unshift(pass);
    this.persist();
  }
}

export const hsCoworkingDb = new HsCoworkingDatabase();

