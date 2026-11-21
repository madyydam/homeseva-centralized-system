import {
  EssentialsSaleItem,
  CrockeryRentalBookingItem,
  HorecaStockItem,
  HorecaEssentialsData,
} from './types';
import { WorkspaceSyncClient } from '@/lib/workspaceSync';

const DB_STORAGE_PREFIX = 'homeseva_db_horeca_essentials_main';

export class HorecaEssentialsDatabase {
  private syncClient: WorkspaceSyncClient<HorecaEssentialsData>;

  constructor() {
    this.syncClient = new WorkspaceSyncClient<HorecaEssentialsData>(
      'horeca-essentials',
      DB_STORAGE_PREFIX,
      {
        salesOrders: [],
        rentalBookings: [],
        stockItems: [],
      },
      'essentials-sales'
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

  getData(): HorecaEssentialsData {
    return this.syncClient.getData();
  }

  addSaleOrder(order: EssentialsSaleItem) {
    this.syncClient.setData((current) => {
      current.salesOrders.unshift(order);
    });
  }

  addRentalBooking(booking: CrockeryRentalBookingItem) {
    this.syncClient.setData((current) => {
      current.rentalBookings.unshift(booking);
    });
  }

  updateRentalStatus(bookingId: string, status: CrockeryRentalBookingItem['status'], breakages = 0) {
    this.syncClient.setData((current) => {
      current.rentalBookings = current.rentalBookings.map((b) =>
        b.id === bookingId ? { ...b, status, breakagesRecorded: breakages } : b
      );
    });
  }

  addStockItem(item: HorecaStockItem) {
    this.syncClient.setData((current) => {
      current.stockItems.unshift(item);
    });
  }
}

export const horecaEssentialsDb = new HorecaEssentialsDatabase();
