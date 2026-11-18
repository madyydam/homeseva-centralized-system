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
  getCrmLeads(telecallerId?: string): PrintboothLeadItem[] {
    if (telecallerId && telecallerId !== 'all') {
      return this.inMemoryCache.leads.filter((l) => l.telecallerId === telecallerId);
    }
    return [...this.inMemoryCache.leads];
  }

  addCrmLead(lead: PrintboothLeadItem) {
    this.inMemoryCache.leads.unshift(lead);
    this.persistLeads();
    this.notifySubscribers();

    // Async sync to PostgreSQL backend with ID reconciliation and rollback
    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/crm-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.lead?.id) {
            const found = this.inMemoryCache.leads.find((l) => l.id === lead.id);
            if (found) {
              found.id = resData.lead.id;
              this.persistLeads();
            }
          } else if (!resData.success) {
            // Rollback local cache if server rejected (e.g. duplicate phone 409)
            this.inMemoryCache.leads = this.inMemoryCache.leads.filter((l) => l.id !== lead.id);
            this.persistLeads();
            this.notifySubscribers();
          }
        })
        .catch((err) => console.warn('Failed to sync printbooth lead to backend:', err));
    }
  }

  updateCrmLead(id: string, updates: Partial<PrintboothLeadItem>) {
    this.inMemoryCache.leads = this.inMemoryCache.leads.map((l) =>
      l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l
    );
    this.persistLeads();
    this.notifySubscribers();

    // Async sync to PostgreSQL backend
    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/crm-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      }).catch((err) => console.warn('Failed to sync update to backend:', err));
    }
  }

  deleteCrmLead(id: string) {
    this.inMemoryCache.leads = this.inMemoryCache.leads.filter((l) => l.id !== id);
    this.persistLeads();
    this.notifySubscribers();

    // Async sync to PostgreSQL backend
    if (typeof window !== 'undefined') {
      fetch(`/api/printbooth/crm-leads?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Failed to sync delete to backend:', err));
    }
  }

  updateLeadNotes(id: string, notesList: [string, string, string, string, string]) {
    this.inMemoryCache.leads = this.inMemoryCache.leads.map((l) =>
      l.id === id ? { ...l, notesList, updatedAt: new Date().toISOString() } : l
    );
    this.persistLeads();
    this.notifySubscribers();

    // Async sync to backend
    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/crm-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notesList }),
      }).catch((err) => console.warn('Failed to sync notes to backend:', err));
    }
  }

  batchAddCrmLeads(newLeads: PrintboothLeadItem[]) {
    this.inMemoryCache.leads = [...newLeads, ...this.inMemoryCache.leads];
    this.persistLeads();
    this.notifySubscribers();

    // Async sync to backend
    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/crm-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads: newLeads }),
      }).catch((err) => console.warn('Failed to sync batch to backend:', err));
    }
  }

  async syncFromBackend(telecallerId?: string): Promise<PrintboothLeadItem[]> {
    if (typeof window === 'undefined') return this.getCrmLeads(telecallerId);
    try {
      const url = telecallerId && telecallerId !== 'all'
        ? `/api/printbooth/crm-leads?telecallerId=${encodeURIComponent(telecallerId)}`
        : '/api/printbooth/crm-leads';
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.leads)) {
        if (telecallerId && telecallerId !== 'all') {
          const otherLeads = this.inMemoryCache.leads.filter((l) => l.telecallerId !== telecallerId);
          this.inMemoryCache.leads = [...data.leads, ...otherLeads];
        } else {
          this.inMemoryCache.leads = data.leads;
        }
        this.persistLeads();
        this.notifySubscribers();
        return this.getCrmLeads(telecallerId);
      }
    } catch (err) {
      console.warn('Failed to sync printbooth leads from backend:', err);
    }
    return this.getCrmLeads(telecallerId);
  }

  // --- ORDERS API ---
  getOrders(): PrintboothMachineOrder[] {
    return [...this.inMemoryCache.orders];
  }

  addOrder(order: PrintboothMachineOrder) {
    this.inMemoryCache.orders.unshift(order);
    this.persistOrders();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.order?.id) {
            const found = this.inMemoryCache.orders.find((o) => o.id === order.id);
            if (found) {
              found.id = data.order.id;
              this.persistOrders();
            }
          }
        })
        .catch((err) => console.warn('Failed to sync order to backend:', err));
    }
  }

  advanceOrderStage(orderId: string) {
    const STAGES: PrintboothMachineOrder['stage'][] = [
      'Order Booked',
      'Payment Received',
      'Assembled & Tested',
      'Dispatched',
      'Delivered',
    ];
    let nextStage: PrintboothMachineOrder['stage'] | undefined;
    this.inMemoryCache.orders = this.inMemoryCache.orders.map((o) => {
      if (o.id !== orderId) return o;
      const idx = STAGES.indexOf(o.stage);
      nextStage = idx < STAGES.length - 1 ? STAGES[idx + 1]! : o.stage;
      return { ...o, stage: nextStage };
    });
    this.persistOrders();
    this.notifySubscribers();

    if (typeof window !== 'undefined' && nextStage) {
      fetch('/api/printbooth/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, stage: nextStage }),
      }).catch((err) => console.warn('Failed to advance order stage on backend:', err));
    }
  }

  async syncOrdersFromBackend(): Promise<PrintboothMachineOrder[]> {
    if (typeof window === 'undefined') return this.getOrders();
    try {
      const res = await fetch('/api/printbooth/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        this.inMemoryCache.orders = data.orders;
        this.persistOrders();
        this.notifySubscribers();
      }
    } catch (err) {
      console.warn('Failed to sync orders from backend:', err);
    }
    return this.getOrders();
  }

  // --- SUPPORT TICKETS API ---
  getTickets(): PrintboothSupportTicket[] {
    return [...this.inMemoryCache.tickets];
  }

  addTicket(ticket: PrintboothSupportTicket) {
    this.inMemoryCache.tickets.unshift(ticket);
    this.persistTickets();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.ticket?.id) {
            const found = this.inMemoryCache.tickets.find((t) => t.id === ticket.id);
            if (found) {
              found.id = data.ticket.id;
              this.persistTickets();
            }
          }
        })
        .catch((err) => console.warn('Failed to sync ticket to backend:', err));
    }
  }

  resolveTicket(ticketId: string, resolutionNotes?: string) {
    const finalNotes = resolutionNotes || 'Issue addressed by support staff';
    this.inMemoryCache.tickets = this.inMemoryCache.tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: 'Resolved' as const,
            resolutionNotes: finalNotes,
          }
        : t
    );
    this.persistTickets();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/printbooth/tickets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ticketId, status: 'Resolved', resolutionNotes: finalNotes }),
      }).catch((err) => console.warn('Failed to resolve ticket on backend:', err));
    }
  }

  async syncTicketsFromBackend(): Promise<PrintboothSupportTicket[]> {
    if (typeof window === 'undefined') return this.getTickets();
    try {
      const res = await fetch('/api/printbooth/tickets');
      const data = await res.json();
      if (data.success && Array.isArray(data.tickets)) {
        this.inMemoryCache.tickets = data.tickets;
        this.persistTickets();
        this.notifySubscribers();
      }
    } catch (err) {
      console.warn('Failed to sync tickets from backend:', err);
    }
    return this.getTickets();
  }
}

export const adjsDb = new AdjsDatabase();

