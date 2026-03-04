import TFormConfig, { TFormStorageConfig } from "./TFormConfig";
import { isFileLikeValue } from "./field";

export type TStoredFileMetadata = {
  __type: "file-metadata";
  name: string;
  size: number;
  mimeType: string;
  lastModified?: number;
};

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

function toStoredFileMetadata(value: File | Blob): TStoredFileMetadata {
  return {
    __type: "file-metadata",
    name: "name" in value && typeof value.name === "string" ? value.name : "blob",
    size: value.size,
    mimeType: value.type || "application/octet-stream",
    lastModified:
      "lastModified" in value && typeof value.lastModified === "number"
        ? value.lastModified
        : undefined,
  };
}

function sanitizeStoredValue(value: any): any {
  if (isFileLikeValue(value)) {
    return toStoredFileMetadata(value as File | Blob);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeStoredValue(entry));
  }

  if (value && typeof value === "object") {
    const nextValue: Record<string, any> = {};
    Object.entries(value).forEach(([key, entry]) => {
      nextValue[key] = sanitizeStoredValue(entry);
    });
    return nextValue;
  }

  return value;
}

function stripStoredFileMetadata(value: any): any {
  if (Array.isArray(value)) {
    const nextValue = value
      .map((entry) => stripStoredFileMetadata(entry))
      .filter((entry) => entry !== undefined);
    return nextValue;
  }

  if (
    value &&
    typeof value === "object" &&
    (value as TStoredFileMetadata).__type === "file-metadata"
  ) {
    return undefined;
  }

  if (value && typeof value === "object") {
    const nextValue: Record<string, any> = {};
    Object.entries(value).forEach(([key, entry]) => {
      const sanitizedEntry = stripStoredFileMetadata(entry);
      if (sanitizedEntry !== undefined) {
        nextValue[key] = sanitizedEntry;
      }
    });
    return nextValue;
  }

  return value;
}

export interface TFormStorageAdapter {
  loadDraft(): Record<string, any> | null;
  saveDraft(values: Record<string, any>): void;
  clearDraft(): void;
  loadQueue(): TQueuedSubmission[];
  saveQueue(values: TQueuedSubmission[]): void;
  clearQueue(): void;
  enqueueSubmission(values: Record<string, any>): TQueuedSubmission[];
  dequeueSubmission(): TQueuedSubmission | null;
  updateQueueEntry(entry: TQueuedSubmission): void;
  loadDeadLetterQueue(): TQueuedSubmission[];
  saveDeadLetterQueue(values: TQueuedSubmission[]): void;
  enqueueDeadLetter(entry: TQueuedSubmission): TQueuedSubmission[];
  removeDeadLetterEntry(entryId: string): TQueuedSubmission | null;
  clearDeadLetterQueue(): void;
}

export function getSerializableStorageValues(values: Record<string, any>): Record<string, any> {
  return sanitizeStoredValue(values) as Record<string, any>;
}

export function getRestorableStorageValues(values: Record<string, any> | null): Record<string, any> {
  if (!values) {
    return {};
  }

  const restored = stripStoredFileMetadata(values);
  return restored && typeof restored === "object" ? restored as Record<string, any> : {};
}

function getDraftKey(formConfig: TFormConfig, storage: TFormStorageConfig): string {
  return storage.key || `xpressui:draft:${formConfig.name}`;
}

function getQueueKey(formConfig: TFormConfig, storage: TFormStorageConfig): string {
  const baseKey = storage.key || `xpressui:queue:${formConfig.name}`;
  return `${baseKey}:queue`;
}

function getDeadLetterKey(formConfig: TFormConfig, storage: TFormStorageConfig): string {
  const baseKey = storage.key || `xpressui:queue:${formConfig.name}`;
  return `${baseKey}:dead-letter`;
}

export class LocalStorageAdapter implements TFormStorageAdapter {
  storageKey: string;
  queueKey: string;
  deadLetterKey: string;

  constructor(storageKey: string, queueKey: string, deadLetterKey: string) {
    this.storageKey = storageKey;
    this.queueKey = queueKey;
    this.deadLetterKey = deadLetterKey;
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
      window.localStorage.setItem(
        this.storageKey,
        JSON.stringify(getSerializableStorageValues(values)),
      );
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

  clearQueue(): void {
    try {
      window.localStorage.removeItem(this.queueKey);
    } catch {
      // Ignore storage clear failures.
    }
  }

  enqueueSubmission(values: Record<string, any>): TQueuedSubmission[] {
    const queue = this.loadQueue();
    queue.push(this.createQueueEntry(getSerializableStorageValues(values)));
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

  loadDeadLetterQueue(): TQueuedSubmission[] {
    try {
      const raw = window.localStorage.getItem(this.deadLetterKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as TQueuedSubmission[];
      }

      const state = parsed as Partial<TQueueState>;
      return Array.isArray(state?.items) ? state.items : [];
    } catch {
      return [];
    }
  }

  saveDeadLetterQueue(values: TQueuedSubmission[]): void {
    try {
      const state: TQueueState = {
        version: 1,
        items: values,
      };
      window.localStorage.setItem(this.deadLetterKey, JSON.stringify(state));
    } catch {
      // Ignore storage write failures.
    }
  }

  enqueueDeadLetter(entry: TQueuedSubmission): TQueuedSubmission[] {
    const queue = this.loadDeadLetterQueue();
    queue.push(entry);
    this.saveDeadLetterQueue(queue);
    return queue;
  }

  removeDeadLetterEntry(entryId: string): TQueuedSubmission | null {
    const queue = this.loadDeadLetterQueue();
    const entry = queue.find((item) => item.id === entryId) || null;
    if (!entry) {
      return null;
    }

    this.saveDeadLetterQueue(queue.filter((item) => item.id !== entryId));
    return entry;
  }

  clearDeadLetterQueue(): void {
    try {
      window.localStorage.removeItem(this.deadLetterKey);
    } catch {
      // Ignore storage clear failures.
    }
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
      getDeadLetterKey(formConfig, storage),
    );
  }

  return null;
}
