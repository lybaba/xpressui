import TFormConfig, { TFormStorageConfig } from "./TFormConfig";

export type TQueuedSubmission = {
  id: string;
  values: Record<string, any>;
  attempts: number;
  createdAt: number;
  updatedAt: number;
  nextAttemptAt: number;
  lastError?: string;
};

type TQueueState = {
  version: 1;
  items: TQueuedSubmission[];
};

export interface TFormStorageAdapter {
  loadDraft(): Record<string, any> | null;
  saveDraft(values: Record<string, any>): void;
  clearDraft(): void;
  loadQueue(): TQueuedSubmission[];
  saveQueue(values: TQueuedSubmission[]): void;
  enqueueSubmission(values: Record<string, any>): TQueuedSubmission[];
  dequeueSubmission(): TQueuedSubmission | null;
  updateQueueEntry(entry: TQueuedSubmission): void;
}

function getDraftKey(formConfig: TFormConfig, storage: TFormStorageConfig): string {
  return storage.key || `xpressui:draft:${formConfig.name}`;
}

function getQueueKey(formConfig: TFormConfig, storage: TFormStorageConfig): string {
  const baseKey = storage.key || `xpressui:queue:${formConfig.name}`;
  return `${baseKey}:queue`;
}

export class LocalStorageAdapter implements TFormStorageAdapter {
  storageKey: string;
  queueKey: string;

  constructor(storageKey: string, queueKey: string) {
    this.storageKey = storageKey;
    this.queueKey = queueKey;
  }

  createQueueEntry(values: Record<string, any>): TQueuedSubmission {
    const now = Date.now();
    return {
      id: `queue_${now}_${Math.random().toString(36).slice(2, 10)}`,
      values,
      attempts: 0,
      createdAt: now,
      updatedAt: now,
      nextAttemptAt: now,
    };
  }

  loadDraft(): Record<string, any> | null {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch {
      return null;
    }
  }

  saveDraft(values: Record<string, any>): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(values));
    } catch {
      // Ignore storage write failures (quota/private mode).
    }
  }

  clearDraft(): void {
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch {
      // Ignore storage clear failures.
    }
  }

  loadQueue(): TQueuedSubmission[] {
    try {
      const raw = window.localStorage.getItem(this.queueKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Backward compatibility with the previous queue format.
        return parsed
          .filter((item) => item && typeof item === "object")
          .map((item) => this.createQueueEntry(item as Record<string, any>));
      }

      const state = parsed as Partial<TQueueState>;
      return Array.isArray(state?.items) ? state.items : [];
    } catch {
      return [];
    }
  }

  saveQueue(values: TQueuedSubmission[]): void {
    try {
      const state: TQueueState = {
        version: 1,
        items: values,
      };
      window.localStorage.setItem(this.queueKey, JSON.stringify(state));
    } catch {
      // Ignore storage write failures.
    }
  }

  enqueueSubmission(values: Record<string, any>): TQueuedSubmission[] {
    const queue = this.loadQueue();
    queue.push(this.createQueueEntry(values));
    this.saveQueue(queue);
    return queue;
  }

  dequeueSubmission(): TQueuedSubmission | null {
    const queue = this.loadQueue();
    if (!queue.length) {
      return null;
    }

    const next = queue.shift() || null;
    this.saveQueue(queue);
    return next;
  }

  updateQueueEntry(entry: TQueuedSubmission): void {
    const queue = this.loadQueue();
    const nextQueue = queue.map((item) => (item.id === entry.id ? entry : item));
    this.saveQueue(nextQueue);
  }
}

export function createStorageAdapter(
  formConfig: TFormConfig | null,
): TFormStorageAdapter | null {
  if (!formConfig?.storage || typeof window === "undefined") {
    return null;
  }

  const storage = formConfig.storage;
  const shouldUseStorage =
    storage.mode === "draft" ||
    storage.mode === "queue" ||
    storage.mode === "draft-and-queue";
  if (!shouldUseStorage) {
    return null;
  }

  const adapter = storage.adapter || "local-storage";
  if (adapter === "local-storage") {
    return new LocalStorageAdapter(
      getDraftKey(formConfig, storage),
      getQueueKey(formConfig, storage),
    );
  }

  return null;
}
