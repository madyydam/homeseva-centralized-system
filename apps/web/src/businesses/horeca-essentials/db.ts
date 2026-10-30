import {
  EssentialsSaleItem,
  CrockeryRentalBookingItem,
  HorecaStockItem,
  HorecaEssentialsData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_horeca_essentials_';

export class HorecaEssentialsDatabase {
  private inMemoryCache: HorecaEssentialsData = {
    salesOrders: [],
    rentalBookings: [],
    stockItems: [],
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

  getData(): HorecaEssentialsData {
    return this.inMemoryCache;
  }

  addSaleOrder(order: EssentialsSaleItem) {
    this.inMemoryCache.salesOrders.unshift(order);
    this.persist();
  }

  addRentalBooking(booking: CrockeryRentalBookingItem) {
    this.inMemoryCache.rentalBookings.unshift(booking);
    this.persist();
  }

  updateRentalStatus(bookingId: string, status: CrockeryRentalBookingItem['status'], breakages = 0) {
    this.inMemoryCache.rentalBookings = this.inMemoryCache.rentalBookings.map((b) =>
      b.id === bookingId ? { ...b, status, breakagesRecorded: breakages } : b
    );
    this.persist();
  }

  addStockItem(item: HorecaStockItem) {
    this.inMemoryCache.stockItems.unshift(item);
    this.persist();
  }
}

export const horecaEssentialsDb = new HorecaEssentialsDatabase();

