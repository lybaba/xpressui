import TFormConfig, { TFormSubmitRequest } from "./TFormConfig";
import {
  createStorageAdapter,
  TFormStorageAdapter,
  TQueuedSubmission,
} from "./form-storage";
import { submitFormValues } from "./form-submit";
import { validatePublicFormConfig } from "./public-schema";

async function submitNow(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
): Promise<{ response: Response; result: any }> {
  return submitFormValues(values, submitConfig);
}

export type TLocalFormAdminSnapshot = {
  draft: Record<string, any> | null;
  queue: TQueuedSubmission[];
  deadLetter: TQueuedSubmission[];
};

export type TLocalQueueQuery = {
  minAttempts?: number;
  maxAttempts?: number;
  search?: string;
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
  listQueue(query?: TLocalQueueQuery): TQueuedSubmission[];
  listDeadLetter(query?: TLocalQueueQuery): TQueuedSubmission[];
  clearDraft(): void;
  clearQueue(): void;
  clearDeadLetter(): void;
  requeueDeadLetterEntry(entryId: string): boolean;
  replayDeadLetterEntry(entryId: string): Promise<boolean>;
};

export function createLocalFormAdmin(formConfig: TFormConfig): TLocalFormAdmin {
  const publicConfig = validatePublicFormConfig(formConfig as unknown as Record<string, any>);
  const storageAdapter: TFormStorageAdapter | null = createStorageAdapter(publicConfig);

  const getSnapshot = (): TLocalFormAdminSnapshot => ({
    draft: storageAdapter?.loadDraft() || null,
    queue: storageAdapter?.loadQueue() || [],
    deadLetter: storageAdapter?.loadDeadLetterQueue() || [],
  });

  return {
    getSnapshot,
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
    async replayDeadLetterEntry(entryId: string) {
      if (!storageAdapter || !publicConfig.submit?.endpoint) {
        return false;
      }

      const entry = storageAdapter.removeDeadLetterEntry(entryId);
      if (!entry) {
        return false;
      }

      try {
        await submitNow(entry.values, publicConfig.submit);
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
  };
}
