import TFormConfig, { TFormStorageConfig } from "./TFormConfig";

export interface TFormStorageAdapter {
  loadDraft(): Record<string, any> | null;
  saveDraft(values: Record<string, any>): void;
  clearDraft(): void;
  loadQueue(): Record<string, any>[];
  saveQueue(values: Record<string, any>[]): void;
  enqueueSubmission(values: Record<string, any>): Record<string, any>[];
  dequeueSubmission(): Record<string, any> | null;
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

  loadQueue(): Record<string, any>[] {
    try {
      const raw = window.localStorage.getItem(this.queueKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  saveQueue(values: Record<string, any>[]): void {
    try {
      window.localStorage.setItem(this.queueKey, JSON.stringify(values));
    } catch {
      // Ignore storage write failures.
    }
  }

  enqueueSubmission(values: Record<string, any>): Record<string, any>[] {
    const queue = this.loadQueue();
    queue.push(values);
    this.saveQueue(queue);
    return queue;
  }

  dequeueSubmission(): Record<string, any> | null {
    const queue = this.loadQueue();
    if (!queue.length) {
      return null;
    }

    const next = queue.shift() || null;
    this.saveQueue(queue);
    return next;
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
