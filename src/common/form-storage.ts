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

export type TStorageSnapshot = {
  draft: Record<string, any> | null;
  queue: TQueuedSubmission[];
  deadLetter: TQueuedSubmission[];
};

export type TStorageHydrationResult = {
  snapshot: TStorageSnapshot;
  source: "local-storage" | "indexeddb";
  migratedFromLocalStorage: boolean;
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
  hydrate?(): Promise<TStorageHydrationResult>;
}

type TIndexedDbRequest<T = any> = {
  onsuccess: ((this: TIndexedDbRequest<T>, event: Event) => any) | null;
  onerror: ((this: TIndexedDbRequest<T>, event: Event) => any) | null;
  onupgradeneeded?: ((this: TIndexedDbRequest<T>, event: Event) => any) | null;
  result: T;
  error?: unknown;
};

type TIndexedDbDatabase = {
  objectStoreNames?: { contains(name: string): boolean };
  createObjectStore(name: string): unknown;
  transaction(
    storeNames: string | string[],
    mode?: "readonly" | "readwrite",
  ): {
    objectStore(name: string): {
      get(key: string): TIndexedDbRequest<any>;
      put(value: any, key: string): TIndexedDbRequest<any>;
      delete(key: string): TIndexedDbRequest<any>;
    };
  };
};

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

  parseDraftRaw(raw: string | null): Record<string, any> | null {
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  }

  parseQueueRaw(raw: string | null): TQueuedSubmission[] {
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((item) => item && typeof item === "object")
        .map((item) => this.createQueueEntry(item as Record<string, any>));
    }

    const state = parsed as Partial<TQueueState>;
    return Array.isArray(state?.items) ? state.items : [];
  }

  parseDeadLetterRaw(raw: string | null): TQueuedSubmission[] {
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as TQueuedSubmission[];
    }

    const state = parsed as Partial<TQueueState>;
    return Array.isArray(state?.items) ? state.items : [];
  }

  loadDraft(): Record<string, any> | null {
    try {
      return this.parseDraftRaw(window.localStorage.getItem(this.storageKey));
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
      return this.parseQueueRaw(window.localStorage.getItem(this.queueKey));
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
      return this.parseDeadLetterRaw(window.localStorage.getItem(this.deadLetterKey));
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

  async hydrate(): Promise<TStorageHydrationResult> {
    return {
      snapshot: {
        draft: this.loadDraft(),
        queue: this.loadQueue(),
        deadLetter: this.loadDeadLetterQueue(),
      },
      source: "local-storage",
      migratedFromLocalStorage: false,
    };
  }
}

export class IndexedDbStorageAdapter extends LocalStorageAdapter {
  dbName: string;
  storeName: string;

  constructor(
    storageKey: string,
    queueKey: string,
    deadLetterKey: string,
    dbName: string,
    storeName: string = "form-state",
  ) {
    super(storageKey, queueKey, deadLetterKey);
    this.dbName = dbName;
    this.storeName = storeName;
    void this.hydrateFromIndexedDb();
  }

  getIndexedDb(): IDBFactory | null {
    if (typeof window === "undefined" || !("indexedDB" in window) || !window.indexedDB) {
      return null;
    }

    return window.indexedDB;
  }

  async openDb(): Promise<TIndexedDbDatabase | null> {
    const indexedDb = this.getIndexedDb();
    if (!indexedDb) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const request = indexedDb.open(this.dbName, 1) as unknown as TIndexedDbRequest<TIndexedDbDatabase>;
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames?.contains?.(this.storeName)) {
            db.createObjectStore(this.storeName);
          }
        };
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async readKey<T = any>(key: string): Promise<T | null> {
    const db = await this.openDb();
    if (!db) {
      return null;
    }

    return new Promise((resolve) => {
      try {
        const request = db
          .transaction(this.storeName, "readonly")
          .objectStore(this.storeName)
          .get(key) as TIndexedDbRequest<T>;
        request.onsuccess = () => resolve((request.result as T) || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async writeKey(key: string, value: string): Promise<void> {
    const db = await this.openDb();
    if (!db) {
      return;
    }

    try {
      db.transaction(this.storeName, "readwrite").objectStore(this.storeName).put(value, key);
    } catch {
      // Ignore IndexedDB write failures.
    }
  }

  async deleteKey(key: string): Promise<void> {
    const db = await this.openDb();
    if (!db) {
      return;
    }

    try {
      db.transaction(this.storeName, "readwrite").objectStore(this.storeName).delete(key);
    } catch {
      // Ignore IndexedDB delete failures.
    }
  }

  async hydrateFromIndexedDb(): Promise<void> {
    const keys = [this.storageKey, this.queueKey, this.deadLetterKey];
    await Promise.all(
      keys.map(async (key) => {
        const value = await this.readKey<string>(key);
        if (typeof value !== "string") {
          return;
        }

        try {
          window.localStorage.setItem(key, value);
        } catch {
          // Ignore cache warm-up failures.
        }
      }),
    );
  }

  getLocalSnapshot(): TStorageSnapshot {
    return {
      draft: this.loadDraft(),
      queue: this.loadQueue(),
      deadLetter: this.loadDeadLetterQueue(),
    };
  }

  async readRawSnapshotFromIndexedDb(): Promise<{
    draftRaw: string | null;
    queueRaw: string | null;
    deadLetterRaw: string | null;
  }> {
    const [draftRaw, queueRaw, deadLetterRaw] = await Promise.all([
      this.readKey<string>(this.storageKey),
      this.readKey<string>(this.queueKey),
      this.readKey<string>(this.deadLetterKey),
    ]);

    return {
      draftRaw: typeof draftRaw === "string" ? draftRaw : null,
      queueRaw: typeof queueRaw === "string" ? queueRaw : null,
      deadLetterRaw: typeof deadLetterRaw === "string" ? deadLetterRaw : null,
    };
  }

  async hydrate(): Promise<TStorageHydrationResult> {
    const indexedDb = this.getIndexedDb();
    if (!indexedDb) {
      return {
        snapshot: this.getLocalSnapshot(),
        source: "local-storage",
        migratedFromLocalStorage: false,
      };
    }

    const indexedDbState = await this.readRawSnapshotFromIndexedDb();
    const hasIndexedDbState = Boolean(
      indexedDbState.draftRaw || indexedDbState.queueRaw || indexedDbState.deadLetterRaw,
    );

    if (!hasIndexedDbState) {
      const localDraftRaw = window.localStorage.getItem(this.storageKey);
      const localQueueRaw = window.localStorage.getItem(this.queueKey);
      const localDeadLetterRaw = window.localStorage.getItem(this.deadLetterKey);
      const hasLocalState = Boolean(localDraftRaw || localQueueRaw || localDeadLetterRaw);

      if (hasLocalState) {
        await Promise.all([
          localDraftRaw ? this.writeKey(this.storageKey, localDraftRaw) : Promise.resolve(),
          localQueueRaw ? this.writeKey(this.queueKey, localQueueRaw) : Promise.resolve(),
          localDeadLetterRaw ? this.writeKey(this.deadLetterKey, localDeadLetterRaw) : Promise.resolve(),
        ]);

        return {
          snapshot: {
            draft: this.parseDraftRaw(localDraftRaw),
            queue: this.parseQueueRaw(localQueueRaw),
            deadLetter: this.parseDeadLetterRaw(localDeadLetterRaw),
          },
          source: "indexeddb",
          migratedFromLocalStorage: true,
        };
      }
    }

    if (indexedDbState.draftRaw !== null) {
      window.localStorage.setItem(this.storageKey, indexedDbState.draftRaw);
    } else {
      window.localStorage.removeItem(this.storageKey);
    }
    if (indexedDbState.queueRaw !== null) {
      window.localStorage.setItem(this.queueKey, indexedDbState.queueRaw);
    } else {
      window.localStorage.removeItem(this.queueKey);
    }
    if (indexedDbState.deadLetterRaw !== null) {
      window.localStorage.setItem(this.deadLetterKey, indexedDbState.deadLetterRaw);
    } else {
      window.localStorage.removeItem(this.deadLetterKey);
    }

    return {
      snapshot: {
        draft: this.parseDraftRaw(indexedDbState.draftRaw),
        queue: this.parseQueueRaw(indexedDbState.queueRaw),
        deadLetter: this.parseDeadLetterRaw(indexedDbState.deadLetterRaw),
      },
      source: "indexeddb",
      migratedFromLocalStorage: false,
    };
  }

  override saveDraft(values: Record<string, any>): void {
    super.saveDraft(values);
    try {
      const serialized = JSON.stringify(getSerializableStorageValues(values));
      void this.writeKey(this.storageKey, serialized);
    } catch {
      // Ignore serialization errors.
    }
  }

  override clearDraft(): void {
    super.clearDraft();
    void this.deleteKey(this.storageKey);
  }

  override saveQueue(values: TQueuedSubmission[]): void {
    super.saveQueue(values);
    try {
      const state: TQueueState = { version: 1, items: values };
      void this.writeKey(this.queueKey, JSON.stringify(state));
    } catch {
      // Ignore serialization errors.
    }
  }

  override clearQueue(): void {
    super.clearQueue();
    void this.deleteKey(this.queueKey);
  }

  override saveDeadLetterQueue(values: TQueuedSubmission[]): void {
    super.saveDeadLetterQueue(values);
    try {
      const state: TQueueState = { version: 1, items: values };
      void this.writeKey(this.deadLetterKey, JSON.stringify(state));
    } catch {
      // Ignore serialization errors.
    }
  }

  override clearDeadLetterQueue(): void {
    super.clearDeadLetterQueue();
    void this.deleteKey(this.deadLetterKey);
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

  if (adapter === "indexeddb") {
    return new IndexedDbStorageAdapter(
      getDraftKey(formConfig, storage),
      getQueueKey(formConfig, storage),
      getDeadLetterKey(formConfig, storage),
      storage.key || `xpressui:idb:${formConfig.name}`,
    );
  }

  return null;
}
