import TFormConfig, { TFormSubmitRequest } from "./TFormConfig";
import {
  createStorageAdapter,
  TFormStorageAdapter,
  TQueuedSubmission,
} from "./form-storage";

function buildSubmitPayload(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
): Record<string, any> {
  if (submitConfig.action === "reservation") {
    return {
      action: "reservation",
      reservation: values,
    };
  }

  if (submitConfig.action === "payment") {
    return {
      action: "payment",
      payment: values,
    };
  }

  if (submitConfig.action === "payment-stripe") {
    return {
      action: "payment-stripe",
      payment: values,
    };
  }

  return values;
}

async function submitNow(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
): Promise<{ response: Response; result: any }> {
  const method = submitConfig.method || "POST";
  const mode = submitConfig.mode || "json";
  const headers = { ...(submitConfig.headers || {}) };
  let url = submitConfig.endpoint;
  const init: RequestInit = { method, headers };
  const payload = buildSubmitPayload(values, submitConfig);

  if (method === "GET") {
    const searchParams = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
    const query = searchParams.toString();
    if (query) {
      url += (url.includes("?") ? "&" : "?") + query;
    }
  } else if (mode === "form-data") {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      body.append(key, String(value));
    });
    init.body = body;
  } else {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    init.body = JSON.stringify(payload);
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") || "";
  let result: any = null;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else if (contentType.startsWith("text/")) {
    result = await response.text();
  }

  if (!response.ok) {
    throw { response, result };
  }

  return { response, result };
}

export type TLocalFormAdminSnapshot = {
  draft: Record<string, any> | null;
  queue: TQueuedSubmission[];
  deadLetter: TQueuedSubmission[];
};

export type TLocalFormAdmin = {
  getSnapshot(): TLocalFormAdminSnapshot;
  clearDraft(): void;
  clearQueue(): void;
  clearDeadLetter(): void;
  requeueDeadLetterEntry(entryId: string): boolean;
  replayDeadLetterEntry(entryId: string): Promise<boolean>;
};

export function createLocalFormAdmin(formConfig: TFormConfig): TLocalFormAdmin {
  const storageAdapter: TFormStorageAdapter | null = createStorageAdapter(formConfig);

  const getSnapshot = (): TLocalFormAdminSnapshot => ({
    draft: storageAdapter?.loadDraft() || null,
    queue: storageAdapter?.loadQueue() || [],
    deadLetter: storageAdapter?.loadDeadLetterQueue() || [],
  });

  return {
    getSnapshot,
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
      if (!storageAdapter || !formConfig.submit?.endpoint) {
        return false;
      }

      const entry = storageAdapter.removeDeadLetterEntry(entryId);
      if (!entry) {
        return false;
      }

      try {
        await submitNow(entry.values, formConfig.submit);
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
