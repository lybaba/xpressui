import TFieldConfig from "./TFieldConfig";
import TFormConfig, { TFormSubmitRequest } from "./TFormConfig";
import { TResumeTokenInfo } from "./form-persistence";
import {
  createStorageAdapter,
  TStorageHealth,
  TFormStorageAdapter,
  TQueuedSubmission,
} from "./form-storage";
import { submitFormValues } from "./form-submit";
import { validatePublicFormConfig } from "./public-schema";

async function submitNow(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
  fieldMap?: Record<string, TFieldConfig>,
): Promise<{ response: Response; result: any }> {
  return submitFormValues(values, submitConfig, fieldMap);
}

function getFieldMap(formConfig: TFormConfig): Record<string, TFieldConfig> {
  const fieldMap: Record<string, TFieldConfig> = {};
  Object.values(formConfig.sections || {})
    .flat()
    .forEach((field) => {
      fieldMap[field.name] = field;
    });
  return fieldMap;
}

export type TLocalFormAdminSnapshot = {
  draft: Record<string, any> | null;
  queue: TQueuedSubmission[];
  deadLetter: TQueuedSubmission[];
};

export type TLocalFormAdminImportMode = "replace" | "merge";

export type TLocalQueueQuery = {
  minAttempts?: number;
  maxAttempts?: number;
  search?: string;
  minAgeMs?: number;
  maxAgeMs?: number;
  nextAttemptBefore?: number;
  nextAttemptAfter?: number;
  errorText?: string;
  sortBy?: "createdAt" | "updatedAt" | "attempts" | "nextAttemptAt";
  sortOrder?: "asc" | "desc";
  limit?: number;
};

function matchesQuery(entry: TQueuedSubmission, query?: TLocalQueueQuery): boolean {
  if (!query) {
    return true;
  }

  if (query.minAttempts !== undefined && entry.attempts < query.minAttempts) {
    return false;
  }

  if (query.maxAttempts !== undefined && entry.attempts > query.maxAttempts) {
    return false;
  }

  if (query.search) {
    const haystack = JSON.stringify(entry.values).toLowerCase();
    if (!haystack.includes(query.search.toLowerCase())) {
      return false;
    }
  }

  const ageMs = Date.now() - entry.createdAt;
  if (query.minAgeMs !== undefined && ageMs < query.minAgeMs) {
    return false;
  }

  if (query.maxAgeMs !== undefined && ageMs > query.maxAgeMs) {
    return false;
  }

  if (query.nextAttemptBefore !== undefined && entry.nextAttemptAt >= query.nextAttemptBefore) {
    return false;
  }

  if (query.nextAttemptAfter !== undefined && entry.nextAttemptAt <= query.nextAttemptAfter) {
    return false;
  }

  if (query.errorText) {
    const errorText = (entry.lastError || "").toLowerCase();
    if (!errorText.includes(query.errorText.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function applyQuery(entries: TQueuedSubmission[], query?: TLocalQueueQuery): TQueuedSubmission[] {
  const filtered = entries.filter((entry) => matchesQuery(entry, query));
  const sortBy = query?.sortBy || "createdAt";
  const sortOrder = query?.sortOrder || "desc";
  const sorted = [...filtered].sort((a, b) => {
    const left = a[sortBy];
    const right = b[sortBy];
    const result = left === right ? 0 : left < right ? -1 : 1;
    return sortOrder === "asc" ? result : -result;
  });

  if (query?.limit !== undefined) {
    return sorted.slice(0, query.limit);
  }

  return sorted;
}

export type TLocalFormAdmin = {
  getSnapshot(): TLocalFormAdminSnapshot;
  getSnapshotAsync(): Promise<TLocalFormAdminSnapshot>;
  exportSnapshot(): TLocalFormAdminSnapshot;
  exportSnapshotAsync(): Promise<TLocalFormAdminSnapshot>;
  importSnapshot(
    snapshot: TLocalFormAdminSnapshot,
    mode?: TLocalFormAdminImportMode,
  ): TLocalFormAdminSnapshot;
  getStorageHealth(): TStorageHealth;
  listResumeTokens(): TResumeTokenInfo[];
  deleteResumeToken(token: string): boolean;
  listQueue(query?: TLocalQueueQuery): TQueuedSubmission[];
  listDeadLetter(query?: TLocalQueueQuery): TQueuedSubmission[];
  clearDraft(): void;
  clearQueue(): void;
  clearDeadLetter(): void;
  purgeQueue(query?: TLocalQueueQuery): number;
  purgeDeadLetter(query?: TLocalQueueQuery): number;
  requeueDeadLetterEntry(entryId: string): boolean;
  requeueDeadLetterEntries(query?: TLocalQueueQuery): number;
  replayDeadLetterEntry(entryId: string): Promise<boolean>;
  replayDeadLetterEntries(
    query?: TLocalQueueQuery,
  ): Promise<{ succeeded: number; failed: number }>;
};

export function createLocalFormAdmin(formConfig: TFormConfig): TLocalFormAdmin {
  const publicConfig = validatePublicFormConfig(formConfig as unknown as Record<string, any>);
  const storageAdapter: TFormStorageAdapter | null = createStorageAdapter(publicConfig);
  const fieldMap = getFieldMap(publicConfig);
  const resumePrefix = `xpressui:resume:${publicConfig.name}:`;

  const getResumeTokenTtlMs = (): number | null =>
    typeof publicConfig.storage?.resumeTokenTtlDays === "number" && publicConfig.storage.resumeTokenTtlDays > 0
      ? publicConfig.storage.resumeTokenTtlDays * 24 * 60 * 60 * 1000
      : null;

  const listResumeTokens = (): TResumeTokenInfo[] => {
    if (typeof window === "undefined") {
      return [];
    }

    const ttlMs = getResumeTokenTtlMs();
    const tokens: TResumeTokenInfo[] = [];
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(resumePrefix)) {
        continue;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        window.localStorage.removeItem(key);
        continue;
      }

      try {
        const parsed = JSON.parse(raw) as { savedAt?: number; resumeEndpoint?: string };
        const savedAt = typeof parsed.savedAt === "number" ? parsed.savedAt : 0;
        const expired = Boolean(ttlMs && savedAt && Date.now() - savedAt > ttlMs);
        if (expired) {
          window.localStorage.removeItem(key);
          continue;
        }
        tokens.push({
          token: key.slice(resumePrefix.length),
          savedAt,
          expired: false,
          resumeEndpoint:
            typeof parsed.resumeEndpoint === "string"
              ? parsed.resumeEndpoint
              : publicConfig.storage?.resumeEndpoint,
        });
      } catch {
        window.localStorage.removeItem(key);
      }
    }

    return tokens.sort((left, right) => right.savedAt - left.savedAt);
  };

  const getSnapshot = (): TLocalFormAdminSnapshot => ({
    draft: storageAdapter?.loadDraft() || null,
    queue: storageAdapter?.loadQueue() || [],
    deadLetter: storageAdapter?.loadDeadLetterQueue() || [],
  });

  const getSnapshotAsync = async (): Promise<TLocalFormAdminSnapshot> => {
    if (storageAdapter?.hydrate) {
      const hydrated = await storageAdapter.hydrate();
      return hydrated.snapshot;
    }

    return getSnapshot();
  };

  return {
    getSnapshot,
    getSnapshotAsync,
    exportSnapshot() {
      return getSnapshot();
    },
    async exportSnapshotAsync() {
      return getSnapshotAsync();
    },
    importSnapshot(snapshot, mode = "replace") {
      if (!storageAdapter) {
        return getSnapshot();
      }

      const safeSnapshot: TLocalFormAdminSnapshot = {
        draft: snapshot?.draft && typeof snapshot.draft === "object" ? snapshot.draft : null,
        queue: Array.isArray(snapshot?.queue) ? snapshot.queue : [],
        deadLetter: Array.isArray(snapshot?.deadLetter) ? snapshot.deadLetter : [],
      };

      const nextDraft =
        mode === "merge"
          ? {
              ...(storageAdapter.loadDraft() || {}),
              ...(safeSnapshot.draft || {}),
            }
          : safeSnapshot.draft;

      const mergeEntries = (
        current: TQueuedSubmission[],
        incoming: TQueuedSubmission[],
      ): TQueuedSubmission[] => {
        const merged = [...current];
        const ids = new Set(current.map((entry) => entry.id));
        incoming.forEach((entry) => {
          if (!ids.has(entry.id)) {
            merged.push(entry);
            ids.add(entry.id);
          }
        });
        return merged;
      };

      const nextQueue =
        mode === "merge"
          ? mergeEntries(storageAdapter.loadQueue(), safeSnapshot.queue)
          : safeSnapshot.queue;
      const nextDeadLetter =
        mode === "merge"
          ? mergeEntries(storageAdapter.loadDeadLetterQueue(), safeSnapshot.deadLetter)
          : safeSnapshot.deadLetter;

      if (nextDraft) {
        storageAdapter.saveDraft(nextDraft);
      } else {
        storageAdapter.clearDraft();
      }
      storageAdapter.saveQueue(nextQueue);
      storageAdapter.saveDeadLetterQueue(nextDeadLetter);

      return getSnapshot();
    },
    getStorageHealth() {
      return (
        storageAdapter?.getHealth() || {
          adapter: "local-storage",
          encryptionEnabled: false,
          hasDraft: false,
          queueLength: 0,
          deadLetterLength: 0,
          totalEntries: 0,
          retentionMs: {
            draft: null,
            queue: null,
            deadLetter: null,
          },
        }
      );
    },
    listResumeTokens,
    deleteResumeToken(token) {
      if (typeof window === "undefined") {
        return false;
      }

      const key = `${resumePrefix}${token}`;
      if (!window.localStorage.getItem(key)) {
        return false;
      }

      window.localStorage.removeItem(key);
      return true;
    },
    listQueue(query) {
      return applyQuery(storageAdapter?.loadQueue() || [], query);
    },
    listDeadLetter(query) {
      return applyQuery(storageAdapter?.loadDeadLetterQueue() || [], query);
    },
    clearDraft() {
      storageAdapter?.clearDraft();
    },
    clearQueue() {
      storageAdapter?.clearQueue();
    },
    clearDeadLetter() {
      storageAdapter?.clearDeadLetterQueue();
    },
    purgeQueue(query) {
      if (!storageAdapter) {
        return 0;
      }

      const queue = storageAdapter.loadQueue();
      const selected = applyQuery(queue, query);
      if (!selected.length) {
        return 0;
      }

      const selectedIds = new Set(selected.map((entry) => entry.id));
      storageAdapter.saveQueue(queue.filter((entry) => !selectedIds.has(entry.id)));
      return selected.length;
    },
    purgeDeadLetter(query) {
      if (!storageAdapter) {
        return 0;
      }

      const deadLetter = storageAdapter.loadDeadLetterQueue();
      const selected = applyQuery(deadLetter, query);
      if (!selected.length) {
        return 0;
      }

      const selectedIds = new Set(selected.map((entry) => entry.id));
      storageAdapter.saveDeadLetterQueue(
        deadLetter.filter((entry) => !selectedIds.has(entry.id))
      );
      return selected.length;
    },
    requeueDeadLetterEntry(entryId: string) {
      if (!storageAdapter) {
        return false;
      }

      const entry = storageAdapter.removeDeadLetterEntry(entryId);
      if (!entry) {
        return false;
      }

      storageAdapter.enqueueSubmission(entry.values);
      return true;
    },
    requeueDeadLetterEntries(query) {
      if (!storageAdapter) {
        return 0;
      }

      const deadLetter = storageAdapter.loadDeadLetterQueue();
      const selected = applyQuery(deadLetter, query);
      if (!selected.length) {
        return 0;
      }

      const selectedIds = new Set(selected.map((entry) => entry.id));
      storageAdapter.saveDeadLetterQueue(
        deadLetter.filter((entry) => !selectedIds.has(entry.id))
      );
      selected.forEach((entry) => {
        storageAdapter.enqueueSubmission(entry.values);
      });
      return selected.length;
    },
    async replayDeadLetterEntry(entryId: string) {
      if (!storageAdapter || !publicConfig.submit?.endpoint) {
        return false;
      }

      const entry = storageAdapter.removeDeadLetterEntry(entryId);
      if (!entry) {
        return false;
      }

      try {
        await submitNow(entry.values, publicConfig.submit, fieldMap);
        return true;
      } catch (error: any) {
        storageAdapter.enqueueDeadLetter({
          ...entry,
          attempts: entry.attempts + 1,
          updatedAt: Date.now(),
          nextAttemptAt: Date.now(),
          lastError: error?.result?.message || error?.message || "replay_error",
        });
        return false;
      }
    },
    async replayDeadLetterEntries(query) {
      if (!storageAdapter || !publicConfig.submit?.endpoint) {
        return { succeeded: 0, failed: 0 };
      }

      const deadLetter = storageAdapter.loadDeadLetterQueue();
      const selected = applyQuery(deadLetter, query);
      if (!selected.length) {
        return { succeeded: 0, failed: 0 };
      }

      let succeeded = 0;
      let failed = 0;

      for (const selectedEntry of selected) {
        const entry = storageAdapter.removeDeadLetterEntry(selectedEntry.id);
        if (!entry) {
          continue;
        }

        try {
          await submitNow(entry.values, publicConfig.submit, fieldMap);
          succeeded += 1;
        } catch (error: any) {
          failed += 1;
          storageAdapter.enqueueDeadLetter({
            ...entry,
            attempts: entry.attempts + 1,
            updatedAt: Date.now(),
            nextAttemptAt: Date.now(),
            lastError: error?.result?.message || error?.message || "replay_error",
          });
        }
      }

      return { succeeded, failed };
    },
  };
}
