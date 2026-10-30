import {
  PrintJobItem,
  PaperStockItem,
  PrintboothData,
} from './types';

const DB_STORAGE_PREFIX = 'homeseva_db_printbooth_';

export class PrintboothDatabase {
  private inMemoryCache: PrintboothData = {
    jobs: [],
    paperStock: [],
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

  getData(): PrintboothData {
    return this.inMemoryCache;
  }

  addJob(job: PrintJobItem) {
    this.inMemoryCache.jobs.unshift(job);
    this.persist();
  }

  advanceJobStage(jobId: string) {
    const STAGES: PrintJobItem['stage'][] = [
      'Artwork Proofing',
      'Plates / Rip',
      'Printing on Press',
      'Post-Press & Binding',
      'Dispatched',
    ];
    this.inMemoryCache.jobs = this.inMemoryCache.jobs.map((j) => {
      if (j.id !== jobId) return j;
      const idx = STAGES.indexOf(j.stage);
      const nextStage = idx < STAGES.length - 1 ? STAGES[idx + 1]! : j.stage;
      return { ...j, stage: nextStage };
    });
    this.persist();
  }

  addPaperStock(paper: PaperStockItem) {
    this.inMemoryCache.paperStock.unshift(paper);
    this.persist();
  }
}

export const printboothDb = new PrintboothDatabase();

