import {
  PrintboothLeadItem,
  PrintboothMachineOrder,
  PrintboothSupportTicket,
  AdjsData,
} from './types';

/**
 * Isolated Persistent Database Layer for ADJS & PRINTBOOTH™
 * STRICTLY ZERO MOCK DATA: Starts completely empty and preserves authentic merchant leads,
 * machine orders, and support records in browser storage.
 */
const DB_STORAGE_PREFIX = 'homeseva_db_adjs_';
const CRM_LEADS_STORAGE_KEY = `${DB_STORAGE_PREFIX}crm_leads_v1`;
const ORDERS_STORAGE_KEY = `${DB_STORAGE_PREFIX}orders_v1`;
const TICKETS_STORAGE_KEY = `${DB_STORAGE_PREFIX}tickets_v1`;

export class AdjsDatabase {
  private subscribers = new Set<() => void>();
  private inMemoryCache: AdjsData = {
    leads: [],
    orders: [],
    tickets: [],
  };

  constructor() {
    this.hydrateFromStorage();
  }

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers() {
    this.subscribers.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Error in ADJS DB subscriber:', err);
      }
    });
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const rawLeads = localStorage.getItem(CRM_LEADS_STORAGE_KEY);
      if (rawLeads) {
        this.inMemoryCache.leads = JSON.parse(rawLeads);
      }
      const rawOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (rawOrders) {
        this.inMemoryCache.orders = JSON.parse(rawOrders);
      }
      const rawTickets = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (rawTickets) {
        this.inMemoryCache.tickets = JSON.parse(rawTickets);
      }
    } catch (e) {
      console.warn('Failed to hydrate ADJS database:', e);
    }
  }

  private persistLeads() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CRM_LEADS_STORAGE_KEY, JSON.stringify(this.inMemoryCache.leads));
    } catch {
      // Ignore
    }
  }

  private persistOrders() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(this.inMemoryCache.orders));
    } catch {
      // Ignore
    }
  }

  private persistTickets() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(this.inMemoryCache.tickets));
    } catch {
      // Ignore
    }
  }

  // --- CRM LEADS API ---
  getCrmLeads(): PrintboothLeadItem[] {
    return [...this.inMemoryCache.leads];
  }

  addCrmLead(lead: PrintboothLeadItem) {
    this.inMemoryCache.leads.unshift(lead);
    this.persistLeads();
    this.notifySubscribers();
  }

  updateCrmLead(id: string, updates: Partial<PrintboothLeadItem>) {
    this.inMemoryCache.leads = this.inMemoryCache.leads.map((l) =>
      l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
    );
    this.persistLeads();
    this.notifySubscribers();
  }

  deleteCrmLead(id: string) {
    this.inMemoryCache.leads = this.inMemoryCache.leads.filter((l) => l.id !== id);
    this.persistLeads();
    this.notifySubscribers();
  }

  updateLeadNotes(id: string, notesList: [string, string, string, string, string]) {
    this.inMemoryCache.leads = this.inMemoryCache.leads.map((l) =>
      l.id === id ? { ...l, notesList, updatedAt: new Date().toISOString() } : l
    );
    this.persistLeads();
    this.notifySubscribers();
  }

  batchAddCrmLeads(newLeads: PrintboothLeadItem[]) {
    this.inMemoryCache.leads = [...newLeads, ...this.inMemoryCache.leads];
    this.persistLeads();
    this.notifySubscribers();
  }

  // --- ORDERS API ---
  getOrders(): PrintboothMachineOrder[] {
    return [...this.inMemoryCache.orders];
  }

  addOrder(order: PrintboothMachineOrder) {
    this.inMemoryCache.orders.unshift(order);
    this.persistOrders();
    this.notifySubscribers();
  }

  advanceOrderStage(orderId: string) {
    const STAGES: PrintboothMachineOrder['stage'][] = [
      'Order Booked',
      'Payment Received',
      'Assembled & Tested',
      'Dispatched',
      'Delivered',
    ];
    this.inMemoryCache.orders = this.inMemoryCache.orders.map((o) => {
      if (o.id !== orderId) return o;
      const idx = STAGES.indexOf(o.stage);
      const nextStage = idx < STAGES.length - 1 ? STAGES[idx + 1]! : o.stage;
      return { ...o, stage: nextStage };
    });
    this.persistOrders();
    this.notifySubscribers();
  }

  // --- SUPPORT TICKETS API ---
  getTickets(): PrintboothSupportTicket[] {
    return [...this.inMemoryCache.tickets];
  }

  addTicket(ticket: PrintboothSupportTicket) {
    this.inMemoryCache.tickets.unshift(ticket);
    this.persistTickets();
    this.notifySubscribers();
  }

  resolveTicket(ticketId: string, resolutionNotes?: string) {
    this.inMemoryCache.tickets = this.inMemoryCache.tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: 'Resolved' as const,
            resolutionNotes: resolutionNotes || 'Issue addressed by support staff',
          }
        : t
    );
    this.persistTickets();
    this.notifySubscribers();
  }
}

export const adjsDb = new AdjsDatabase();

