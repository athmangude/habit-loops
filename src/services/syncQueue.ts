import type { CellValue } from '../types/habit';
import { batchWriteCells } from './sheetsService';

interface QueueEntry {
  day: number;
  habitIndex: number;
  value: CellValue;
}

type SyncStatusListener = (status: 'idle' | 'syncing' | 'error', error?: string) => void;

class SyncQueue {
  private queue: Map<string, QueueEntry> = new Map();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private spreadsheetId: string | null = null;
  private month: number = 1;
  private retryCount = 0;
  private maxRetries = 3;
  private debounceMs = 300;
  private listener: SyncStatusListener | null = null;

  setContext(spreadsheetId: string, month: number) {
    this.spreadsheetId = spreadsheetId;
    this.month = month;
  }

  setListener(listener: SyncStatusListener) {
    this.listener = listener;
  }

  enqueue(day: number, habitIndex: number, value: CellValue) {
    const key = `${day}-${habitIndex}`;
    this.queue.set(key, { day, habitIndex, value });

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => this.flush(), this.debounceMs);
  }

  async flush(): Promise<void> {
    if (this.queue.size === 0 || !this.spreadsheetId) return;

    const updates = Array.from(this.queue.values());
    this.queue.clear();
    this.timer = null;

    this.listener?.('syncing');

    try {
      await batchWriteCells(this.spreadsheetId, this.month, updates);
      this.retryCount = 0;
      this.listener?.('idle');
    } catch (err) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        // Re-enqueue failed updates
        for (const update of updates) {
          const key = `${update.day}-${update.habitIndex}`;
          this.queue.set(key, update);
        }
        const delay = Math.pow(2, this.retryCount) * 1000;
        this.timer = setTimeout(() => this.flush(), delay);
        this.listener?.('syncing');
      } else {
        this.retryCount = 0;
        this.listener?.('error', err instanceof Error ? err.message : 'Sync failed');
      }
    }
  }

  clear() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.queue.clear();
    this.retryCount = 0;
  }
}

export const syncQueue = new SyncQueue();
