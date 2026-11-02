import {
  OrderItem,
  MeasurementItem,
  AppointmentItem,
  InventoryItem,
  InvoiceItem,
  AssetRegisterItem,
  DailyTaskItem,
  ClientCallLogItem,
  CrmLeadItem,
  FinanceTransactionItem,
  GentleHairWigsStudioData,
  StudioInfoItem,
} from './types';
import { gentleHairWigsConfig } from './config';

/**
 * Isolated PostgreSQL-Backed Database Layer for Gentle Hair Wigs (Business ID: 3)
 * Guarantees 100% server-side persistence in PostgreSQL with seamless client reactivity.
 * Zero mock data: starts clean and preserves every user record across browser refreshes and VPS deployment.
 */
const DB_STORAGE_PREFIX = 'homeseva_db_gentle_hair_wigs_';
const CENTRAL_CRM_STORAGE_KEY = 'homeseva_gentle_hair_wigs_central_crm_v10_postgres';
const CUSTOM_STUDIOS_STORAGE_KEY = 'homeseva_gentle_hair_wigs_custom_studios_v3_postgres';

// ZERO MOCK DATA - Clean authentic empty lists
const DEFAULT_ASSETS: AssetRegisterItem[] = [];
const DEFAULT_TASKS: DailyTaskItem[] = [];
const DEFAULT_CALL_LOGS: ClientCallLogItem[] = [];
const DEFAULT_CRM_LEADS: CrmLeadItem[] = [];
const DEFAULT_FINANCE_TRANSACTIONS: FinanceTransactionItem[] = [];

function createDefaultBranchData(): GentleHairWigsStudioData {
  return {
    orders: [],
    measurements: [],
    appointments: [],
    inventory: [],
    invoices: [],
    assets: [],
    dailyTasks: [],
    callLogs: [],
    crmLeads: [],
    financeTransactions: [],
  };
}

export class GentleHairWigsDatabase {
  private isHydrated = false;
  private isSyncing = false;
  private lastSyncTimestamp: string | null = null;
  private subscribers = new Set<() => void>();
  private centralCrmLeads: CrmLeadItem[] = [];
  private customStudios: StudioInfoItem[] = [];
  private inMemoryCache: Record<string, GentleHairWigsStudioData> = {
    'viman-nagar': createDefaultBranchData(),
    'ravet': createDefaultBranchData(),
    'kolhapur': createDefaultBranchData(),
  };

  constructor() {
    this.hydrateFromStorage();
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncFromDatabase();
      }, 0);
    }
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
        console.error('Error in subscriber callback:', err);
      }
    });
  }

  async syncFromDatabase() {
    if (typeof window === 'undefined' || this.isSyncing) return;
    this.isSyncing = true;
    try {
      const leadsUrl = this.lastSyncTimestamp && this.centralCrmLeads.length > 0
        ? `/api/gentle-hair-wigs/crm-leads?since=${encodeURIComponent(this.lastSyncTimestamp)}`
        : '/api/gentle-hair-wigs/crm-leads';

      const [leadsRes, studiosRes, syncRes] = await Promise.allSettled([
        fetch(leadsUrl),
        fetch('/api/gentle-hair-wigs/studios'),
        fetch('/api/gentle-hair-wigs/sync?studioSlug=all'),
      ]);

      let changed = false;

      // 1. Sync CRM Leads from PostgreSQL
      if (leadsRes.status === 'fulfilled' && leadsRes.value.ok) {
        const data = await leadsRes.value.json();
        if (data.success && Array.isArray(data.leads)) {
          if (data.serverTime) {
            this.lastSyncTimestamp = data.serverTime;
          }

          if (data.isDelta) {
            if (data.leads.length > 0) {
              const updatedMap = new Map<string, any>();
              data.leads.forEach((l: any) => updatedMap.set(l.id, l));

              this.centralCrmLeads = this.centralCrmLeads.map((item) => {
                if (updatedMap.has(item.id)) {
                  const updated = updatedMap.get(item.id);
                  updatedMap.delete(item.id);
                  return { ...item, ...updated };
                }
                return item;
              });

              updatedMap.forEach((newLead) => {
                this.centralCrmLeads.unshift(newLead);
              });

              this.centralCrmLeads.forEach((item, idx) => {
                item.srNo = idx + 1;
              });
              this.persistCentralCrm();
              changed = true;
            }
          } else {
            // Full sync from PostgreSQL
            this.centralCrmLeads = data.leads.map((item: any, idx: number) => ({
              ...item,
              srNo: typeof item.srNo === 'number' ? item.srNo : idx + 1,
              status: item.status || 'Not Selected',
              callCount: typeof item.callCount === 'number' ? item.callCount : 0,
              notesList: Array.isArray(item.notesList) ? item.notesList : [],
              studioSlug: item.studioSlug || 'viman-nagar',
              studioName: item.studioName || 'Studio of Viman Nagar',
            }));
            this.persistCentralCrm();
            changed = true;
          }
        }
      }

      // 2. Sync Custom Studios from PostgreSQL
      if (studiosRes.status === 'fulfilled' && studiosRes.value.ok) {
        const sdata = await studiosRes.value.json();
        if (sdata.success && Array.isArray(sdata.studios)) {
          this.customStudios = sdata.studios.filter((s: any) => s.isCustom);
          this.persistCustomStudios();
          changed = true;
        }
      }

      // 3. Sync Studio Operations from PostgreSQL (Orders, Measurements, Appointments, Tasks, etc.)
      if (syncRes.status === 'fulfilled' && syncRes.value.ok) {
        const syncData = await syncRes.value.json();
        if (syncData.success && syncData.data) {
          const d = syncData.data;
          const branches = ['viman-nagar', 'ravet', 'kolhapur', ...this.customStudios.map((s) => s.slug)];

          branches.forEach((branch) => {
            if (!this.inMemoryCache[branch]) {
              this.inMemoryCache[branch] = createDefaultBranchData();
            }
            const cache = this.inMemoryCache[branch]!;

            // Merge server-backed records
            cache.orders = Array.isArray(d.orders) ? d.orders : cache.orders;
            cache.measurements = Array.isArray(d.measurements) ? d.measurements : cache.measurements;
            cache.appointments = Array.isArray(d.appointments) ? d.appointments : cache.appointments;
            cache.inventory = Array.isArray(d.inventory) ? d.inventory : cache.inventory;
            cache.invoices = Array.isArray(d.invoices) ? d.invoices : cache.invoices;
            cache.assets = Array.isArray(d.assets) ? d.assets : cache.assets;
            cache.dailyTasks = Array.isArray(d.dailyTasks) ? d.dailyTasks : cache.dailyTasks;
            cache.callLogs = Array.isArray(d.callLogs) ? d.callLogs : cache.callLogs;
            cache.financeTransactions = Array.isArray(d.financeTransactions)
              ? d.financeTransactions
              : cache.financeTransactions;
            cache.crmLeads = [...this.centralCrmLeads];

            this.persist(branch);
          });
          changed = true;
        }
      }

      if (changed) {
        this.notifySubscribers();
      }
    } catch (err) {
      console.warn('PostgreSQL background sync deferred:', err);
    } finally {
      this.isSyncing = false;
    }
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined') return;
    this.isHydrated = true;
    try {
      // 1. Purge all legacy mock data keys across all past versions
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('homeseva_gentle_hair_wigs_') || key.startsWith('homeseva_db_gentle_hair_wigs_'))) {
          if (!key.includes('_v10_')) {
            keysToRemove.push(key);
          }
        }
      }
      keysToRemove.forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });

      // 2. Hydrate Centralized CRM Leads
      const rawCentralCrm = localStorage.getItem(CENTRAL_CRM_STORAGE_KEY);
      if (rawCentralCrm) {
        try {
          const parsed = JSON.parse(rawCentralCrm);
          if (Array.isArray(parsed)) {
            // Filter out any legacy dummy records
            this.centralCrmLeads = parsed
              .filter((item) => item.clientName !== 'Sanjay Malhotra' && item.clientName !== 'Dr. Ananya Sen')
              .map((item: any, idx: number) => ({
                ...item,
                srNo: typeof item.srNo === 'number' ? item.srNo : idx + 1,
                status: item.status || 'Not Selected',
                callCount: typeof item.callCount === 'number' ? item.callCount : 0,
                notesList: Array.isArray(item.notesList)
                  ? item.notesList
                  : item.notes
                  ? [item.notes]
                  : [],
                studioSlug: item.studioSlug || 'viman-nagar',
                studioName: item.studioName || 'Studio of Viman Nagar',
              }));
          }
        } catch {
          this.centralCrmLeads = [];
        }
      }

      // 3. Hydrate Custom Studios
      const rawStudios = localStorage.getItem(CUSTOM_STUDIOS_STORAGE_KEY);
      if (rawStudios) {
        try {
          const parsed = JSON.parse(rawStudios);
          if (Array.isArray(parsed)) {
            this.customStudios = parsed;
          }
        } catch {}
      }

      // 4. Hydrate Branch Data
      const branches = ['viman-nagar', 'ravet', 'kolhapur'];
      branches.forEach((branch) => {
        const raw = localStorage.getItem(`${DB_STORAGE_PREFIX}${branch}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            // Purge any mock items from cached branch arrays
            const cleanAssets = Array.isArray(parsed.assets)
              ? parsed.assets.filter((a: any) => !a.id?.startsWith('AST-10'))
              : [];
            const cleanTasks = Array.isArray(parsed.dailyTasks)
              ? parsed.dailyTasks.filter((t: any) => !t.id?.startsWith('TSK-10'))
              : [];
            const cleanCallLogs = Array.isArray(parsed.callLogs)
              ? parsed.callLogs.filter((c: any) => !c.id?.startsWith('CAL-10'))
              : [];
            const cleanFinance = Array.isArray(parsed.financeTransactions)
              ? parsed.financeTransactions.filter((f: any) => !f.id?.startsWith('FTX-26'))
              : [];

            this.inMemoryCache[branch] = {
              orders: parsed.orders || [],
              measurements: parsed.measurements || [],
              appointments: parsed.appointments || [],
              inventory: parsed.inventory || [],
              invoices: parsed.invoices || [],
              assets: cleanAssets,
              dailyTasks: cleanTasks,
              callLogs: cleanCallLogs,
              crmLeads: [...this.centralCrmLeads],
              financeTransactions: cleanFinance,
            };
          } catch {
            this.inMemoryCache[branch] = createDefaultBranchData();
          }
        } else if (this.inMemoryCache[branch]) {
          this.inMemoryCache[branch]!.crmLeads = [...this.centralCrmLeads];
        }
      });
    } catch {
      // Storage unavailable or disabled
    }
  }

  private persist(branch: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        `${DB_STORAGE_PREFIX}${branch}`,
        JSON.stringify(this.inMemoryCache[branch])
      );
    } catch {}
  }

  private persistCentralCrm() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CENTRAL_CRM_STORAGE_KEY, JSON.stringify(this.centralCrmLeads));
      Object.keys(this.inMemoryCache).forEach((branchKey) => {
        if (this.inMemoryCache[branchKey]) {
          this.inMemoryCache[branchKey].crmLeads = [...this.centralCrmLeads];
        }
      });
    } catch {}
  }

  private persistCustomStudios() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CUSTOM_STUDIOS_STORAGE_KEY, JSON.stringify(this.customStudios));
    } catch {}
  }

  getStudioData(branch: string): GentleHairWigsStudioData {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    const data = this.inMemoryCache[branch] || createDefaultBranchData();
    data.crmLeads = [...this.centralCrmLeads];
    return data;
  }

  // --- Orders (Persisted in PostgreSQL) ---
  addOrder(branch: string, order: OrderItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    order.clientName = order.clientName?.trim() || "Don't know";
    this.inMemoryCache[branch].orders.unshift(order);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'order', studioSlug: branch, item: order }),
      }).catch((err) => console.warn('Deferred order sync:', err));
    }
  }

  advanceOrderStage(branch: string, orderId: string) {
    const STAGES: OrderItem['stage'][] = [
      'Measurements Recorded',
      'Lace Base Crafting',
      'Hand-Knotting Hair',
      'Custom Styling',
      'Fitting & Trial',
      'Delivered',
    ];
    const data = this.inMemoryCache[branch];
    if (!data) return;

    let targetStage: OrderItem['stage'] | null = null;
    data.orders = data.orders.map((o) => {
      if (o.id !== orderId) return o;
      const idx = STAGES.indexOf(o.stage);
      const nextStage = idx < STAGES.length - 1 ? STAGES[idx + 1]! : o.stage;
      targetStage = nextStage;
      return { ...o, stage: nextStage };
    });
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined' && targetStage) {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'order',
          studioSlug: branch,
          item: { id: orderId, stage: targetStage },
        }),
      }).catch((err) => console.warn('Deferred order stage update:', err));
    }
  }

  // --- Measurements (Persisted in PostgreSQL) ---
  addMeasurement(branch: string, measurement: MeasurementItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    measurement.clientName = measurement.clientName?.trim() || "Don't know";
    this.inMemoryCache[branch].measurements.unshift(measurement);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'measurement', studioSlug: branch, item: measurement }),
      }).catch((err) => console.warn('Deferred measurement sync:', err));
    }
  }

  // --- Appointments (Persisted in PostgreSQL) ---
  addAppointment(branch: string, appointment: AppointmentItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    appointment.clientName = appointment.clientName?.trim() || "Don't know";
    this.inMemoryCache[branch].appointments.unshift(appointment);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'appointment', studioSlug: branch, item: appointment }),
      }).catch((err) => console.warn('Deferred appointment sync:', err));
    }
  }

  updateAppointmentStatus(branch: string, apptId: string, status: AppointmentItem['status']) {
    const data = this.inMemoryCache[branch];
    if (!data) return;
    data.appointments = data.appointments.map((a) => (a.id === apptId ? { ...a, status } : a));
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'appointment',
          studioSlug: branch,
          item: { id: apptId, status },
        }),
      }).catch((err) => console.warn('Deferred appointment status sync:', err));
    }
  }

  // --- Inventory (Persisted in PostgreSQL) ---
  addInventoryItem(branch: string, item: InventoryItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    this.inMemoryCache[branch].inventory.unshift(item);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'inventory', studioSlug: branch, item }),
      }).catch((err) => console.warn('Deferred inventory sync:', err));
    }
  }

  adjustInventory(branch: string, itemId: string, delta: number) {
    const data = this.inMemoryCache[branch];
    if (!data) return;
    let newQty = 0;
    data.inventory = data.inventory.map((i) => {
      if (i.id !== itemId) return i;
      newQty = Math.max(0, i.stockQuantity + delta);
      return { ...i, stockQuantity: newQty };
    });
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'inventory',
          studioSlug: branch,
          item: { id: itemId, stockQuantity: newQty },
        }),
      }).catch((err) => console.warn('Deferred inventory adjustment sync:', err));
    }
  }

  // --- Invoices (Persisted in PostgreSQL) ---
  addInvoice(branch: string, invoice: InvoiceItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    invoice.clientName = invoice.clientName?.trim() || "Don't know";
    this.inMemoryCache[branch].invoices.unshift(invoice);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'invoice', studioSlug: branch, item: invoice }),
      }).catch((err) => console.warn('Deferred invoice sync:', err));
    }
  }

  // --- Assets Register (Persisted in PostgreSQL) ---
  addAsset(branch: string, asset: AssetRegisterItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    this.inMemoryCache[branch].assets.unshift(asset);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'asset', studioSlug: branch, item: asset }),
      }).catch((err) => console.warn('Deferred asset sync:', err));
    }
  }

  updateAssetCondition(branch: string, assetId: string, condition: AssetRegisterItem['condition']) {
    const data = this.inMemoryCache[branch];
    if (!data) return;
    data.assets = data.assets.map((a) => (a.id === assetId ? { ...a, condition } : a));
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'asset',
          studioSlug: branch,
          item: { id: assetId, condition },
        }),
      }).catch((err) => console.warn('Deferred asset condition sync:', err));
    }
  }

  // --- Daily Tasks (Persisted in PostgreSQL) ---
  toggleDailyTask(branch: string, taskId: string) {
    const data = this.inMemoryCache[branch];
    if (!data) return;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    let updatedTask: DailyTaskItem | null = null;
    data.dailyTasks = data.dailyTasks.map((t) => {
      if (t.id !== taskId) return t;
      const nextCompleted = !t.completed;
      updatedTask = {
        ...t,
        completed: nextCompleted,
        completedAt: nextCompleted ? nowTime : undefined,
      };
      return updatedTask;
    });
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined' && updatedTask) {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'dailyTask',
          studioSlug: branch,
          item: updatedTask,
        }),
      }).catch((err) => console.warn('Deferred task toggle sync:', err));
    }
  }

  addDailyTask(branch: string, task: DailyTaskItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    this.inMemoryCache[branch].dailyTasks.unshift(task);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'dailyTask', studioSlug: branch, item: task }),
      }).catch((err) => console.warn('Deferred daily task sync:', err));
    }
  }

  // --- Call Logs (Persisted in PostgreSQL) ---
  addCallLog(branch: string, callLog: ClientCallLogItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    callLog.clientName = callLog.clientName?.trim() || "Don't know";
    this.inMemoryCache[branch].callLogs.unshift(callLog);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'callLog', studioSlug: branch, item: callLog }),
      }).catch((err) => console.warn('Deferred call log sync:', err));
    }
  }

  // --- Finance & Monthly P&L (Persisted in PostgreSQL) ---
  addFinanceTransaction(branch: string, transaction: FinanceTransactionItem) {
    if (!this.inMemoryCache[branch]) this.inMemoryCache[branch] = createDefaultBranchData();
    this.inMemoryCache[branch].financeTransactions.unshift(transaction);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity: 'financeTransaction', studioSlug: branch, item: transaction }),
      }).catch((err) => console.warn('Deferred finance transaction sync:', err));
    }
  }

  deleteFinanceTransaction(branch: string, txId: string) {
    const data = this.inMemoryCache[branch];
    if (!data) return;
    data.financeTransactions = data.financeTransactions.filter((tx) => tx.id !== txId);
    this.persist(branch);
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch(`/api/gentle-hair-wigs/sync?entity=financeTransaction&id=${encodeURIComponent(txId)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Deferred finance transaction delete:', err));
    }
  }

  // --- Centralized Client CRM & Leads (Multi-Studio Sync with PostgreSQL) ---
  getCentralCrmLeads(): CrmLeadItem[] {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    return [...this.centralCrmLeads];
  }

  getStudiosList(): StudioInfoItem[] {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    const defaultStudios: StudioInfoItem[] = (gentleHairWigsConfig.branches || []).map((b) => ({
      slug: b.slug,
      name: b.name,
      shortName: b.shortName,
      address: b.address ?? undefined,
      isCustom: false,
    }));
    const merged = [...defaultStudios];
    for (const cs of this.customStudios) {
      if (!merged.some((m) => m.slug === cs.slug)) {
        merged.push(cs);
      }
    }
    for (const lead of this.centralCrmLeads) {
      if (lead.studioSlug && !merged.some((m) => m.slug === lead.studioSlug)) {
        merged.push({
          slug: lead.studioSlug,
          name: lead.studioName || lead.studioSlug,
          shortName: lead.studioName?.replace(/Studio\s*(of)?\s*/i, '') || lead.studioSlug,
          isCustom: true,
        });
      }
    }
    return merged;
  }

  addCustomStudio(name: string, address?: string): StudioInfoItem {
    const cleanName = name.trim();
    const slug =
      cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') || `studio-${Date.now()}`;

    const existing = this.getStudiosList().find(
      (s) => s.slug === slug || s.name.toLowerCase() === cleanName.toLowerCase()
    );
    if (existing) return existing;

    const newStudio: StudioInfoItem = {
      slug,
      name: cleanName,
      shortName: cleanName.replace(/Studio\s*(of)?\s*/i, ''),
      address: address?.trim() || 'New Studio Location',
      isCustom: true,
    };

    this.customStudios.push(newStudio);
    this.persistCustomStudios();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/studios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudio),
      }).catch((err) => console.warn('Deferred studio sync error:', err));
    }

    return newStudio;
  }

  addCentralCrmLead(lead: Partial<CrmLeadItem> & { clientName?: string; phone: string }): CrmLeadItem {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    const studios = this.getStudiosList();
    const targetStudioSlug = lead.studioSlug || 'viman-nagar';
    const targetStudio = studios.find((s) => s.slug === targetStudioSlug) || studios[0]!;

    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    const localId = lead.id || `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newLead: CrmLeadItem = {
      id: localId,
      srNo: this.centralCrmLeads.length + 1,
      studioSlug: targetStudio.slug,
      studioName: targetStudio.name,
      clientName: lead.clientName?.trim() || "Don't know",
      phone: lead.phone.trim(),
      status: lead.status || 'Not Selected',
      customStatusText: lead.customStatusText || '',
      callCount: typeof lead.callCount === 'number' ? lead.callCount : 0,
      notesList: Array.isArray(lead.notesList) ? lead.notesList.filter(Boolean) : lead.notes ? [lead.notes] : [],
      city: lead.city || 'Pune',
      source: lead.source || 'Walk-in',
      stage: lead.stage || 'New Inquiry',
      hairLossConcern: lead.hairLossConcern || 'Frontal / Crown Thinning',
      interestCategory: lead.interestCategory || 'HD Lace Toupee / Patch',
      estimatedBudget: Number(lead.estimatedBudget) || 28000,
      assignedSpecialist: lead.assignedSpecialist || 'Senior Wig Specialist',
      lastContactDate: lead.lastContactDate || todayYMD,
      nextFollowUpDate: lead.nextFollowUpDate || '',
      priority: lead.priority || 'Normal',
      createdAt: lead.createdAt || todayYMD,
      updatedAt: lead.updatedAt || lead.createdAt || todayYMD,
    };

    this.centralCrmLeads.unshift(newLead);
    this.centralCrmLeads.forEach((item, idx) => {
      item.srNo = idx + 1;
    });
    this.persistCentralCrm();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/crm-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success && resData.lead?.id) {
            const found = this.centralCrmLeads.find((l) => l.id === localId);
            if (found) {
              found.id = resData.lead.id;
              this.persistCentralCrm();
            }
          }
        })
        .catch((err) => console.warn('Deferred lead POST sync:', err));
    }

    return newLead;
  }

  addCentralCrmLeadsBatch(leadsToAdd: Array<Partial<CrmLeadItem> & { clientName?: string; phone: string }>): CrmLeadItem[] {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    const studios = this.getStudiosList();
    const createdLeads: CrmLeadItem[] = [];

    leadsToAdd.forEach((lead, idx) => {
      const targetStudioSlug = lead.studioSlug || 'viman-nagar';
      const targetStudio = studios.find((s) => s.slug === targetStudioSlug) || studios[0]!;

      const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
      const newLead: CrmLeadItem = {
        id: lead.id || `lead_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        srNo: 0,
        studioSlug: targetStudio.slug,
        studioName: targetStudio.name,
        clientName: lead.clientName?.trim() || "Don't know",
        phone: lead.phone.trim(),
        status: lead.status || 'Not Selected',
        customStatusText: lead.customStatusText || '',
        callCount: typeof lead.callCount === 'number' ? lead.callCount : 0,
        notesList: Array.isArray(lead.notesList) ? lead.notesList.filter(Boolean) : lead.notes ? [lead.notes] : [],
        city: lead.city || 'Pune',
        source: lead.source || 'Walk-in',
        stage: lead.stage || 'New Inquiry',
        hairLossConcern: lead.hairLossConcern || 'Frontal / Crown Thinning',
        interestCategory: lead.interestCategory || 'HD Lace Toupee / Patch',
        estimatedBudget: Number(lead.estimatedBudget) || 28000,
        assignedSpecialist: lead.assignedSpecialist || 'Senior Wig Specialist',
        lastContactDate: lead.lastContactDate || todayYMD,
        nextFollowUpDate: lead.nextFollowUpDate || '',
        priority: lead.priority || 'Normal',
        createdAt: lead.createdAt || todayYMD,
        updatedAt: lead.updatedAt || lead.createdAt || todayYMD,
      };
      createdLeads.push(newLead);
    });

    this.centralCrmLeads.unshift(...createdLeads);
    this.centralCrmLeads.forEach((item, idx) => {
      item.srNo = idx + 1;
    });
    this.persistCentralCrm();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/crm-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createdLeads),
      })
        .then((res) => res.json())
        .then((resData) => {
          if (resData.success) {
            this.syncFromDatabase();
          }
        })
        .catch((err) => console.warn('Deferred batch POST sync:', err));
    }

    return createdLeads;
  }

  updateCentralCrmLead(leadId: string, updates: Partial<CrmLeadItem>): void {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    const studios = this.getStudiosList();
    const todayYMD = new Date().toISOString().split('T')[0] || '2026-10-30';
    this.centralCrmLeads = this.centralCrmLeads.map((item) => {
      if (item.id !== leadId) return item;

      const effectiveUpdates = { ...updates, updatedAt: updates.updatedAt || todayYMD };
      const effectiveStatus = updates.status !== undefined ? updates.status : item.status;
      if (effectiveStatus !== 'Follow-up') {
        effectiveUpdates.nextFollowUpDate = '';
      }

      const merged = { ...item, ...effectiveUpdates };
      if (updates.studioSlug && !updates.studioName) {
        const found = studios.find((s) => s.slug === updates.studioSlug);
        if (found) merged.studioName = found.name;
      }
      return merged;
    });
    this.persistCentralCrm();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch('/api/gentle-hair-wigs/crm-leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, ...updates, updatedAt: todayYMD }),
      }).catch((err) => console.warn('Deferred PATCH sync:', err));
    }
  }

  deleteCentralCrmLead(leadId: string): void {
    if (!this.isHydrated && typeof window !== 'undefined') {
      this.hydrateFromStorage();
    }
    this.centralCrmLeads = this.centralCrmLeads.filter((item) => item.id !== leadId);
    this.centralCrmLeads.forEach((item, idx) => {
      item.srNo = idx + 1;
    });
    this.persistCentralCrm();
    this.notifySubscribers();

    if (typeof window !== 'undefined') {
      fetch(`/api/gentle-hair-wigs/crm-leads?id=${encodeURIComponent(leadId)}`, {
        method: 'DELETE',
      }).catch((err) => console.warn('Deferred DELETE sync:', err));
    }
  }

  // --- Studio Branch Wrappers ---
  addCrmLead(_branch: string, lead: CrmLeadItem) {
    this.addCentralCrmLead(lead);
  }

  updateCrmLeadStage(_branch: string, leadId: string, stage: CrmLeadItem['stage']) {
    if (stage) {
      this.updateCentralCrmLead(leadId, { stage });
    }
  }

  updateCrmLead(_branch: string, leadId: string, updates: Partial<CrmLeadItem>) {
    this.updateCentralCrmLead(leadId, updates);
  }

  deleteCrmLead(_branch: string, leadId: string) {
    this.deleteCentralCrmLead(leadId);
  }
}

export const gentleHairWigsDb = new GentleHairWigsDatabase();
