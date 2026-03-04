import TFormConfig, { TFormSubmitRequest } from "./TFormConfig";
import { isFileFieldType } from "./field";
import { generateRuntimeId } from "./id";
import {
  createStorageAdapter,
  getSerializableStorageValues,
  getRestorableStorageValues,
  TStorageHealth,
  TStorageHydrationResult,
  TFormStorageAdapter,
  TQueuedSubmission,
} from "./form-storage";

export type TFormQueueState = {
  queueLength: number;
  deadLetterLength: number;
  nextAttemptAt?: number;
  attempts?: number;
  disabledReason?: string;
};

export type TFormStorageSnapshot = {
  draft: Record<string, any> | null;
  queue: TQueuedSubmission[];
  deadLetter: TQueuedSubmission[];
  currentStepIndex?: number;
};

export type TFormStorageHealth = TStorageHealth & {
  queueDisabledReason?: string;
  queueEnabled: boolean;
};

export type TResumeTokenInfo = {
  token: string;
  savedAt: number;
  expired: boolean;
  resumeEndpoint?: string;
};

export type TResumeLookupResult = TResumeTokenInfo & {
  snapshot: TFormStorageSnapshot | null;
};

type TResumeTokenState = {
  version: 1;
  savedAt: number;
  snapshot: TFormStorageSnapshot;
  resumeEndpoint?: string;
};

type TFormPersistenceRuntimeOptions = {
  getFormConfig(): TFormConfig | null;
  getValues(): Record<string, any>;
  getCurrentStepIndex?(): number | null;
  setCurrentStepIndex?(index: number): void;
  emitEvent(eventName: string, detail: Record<string, any>): boolean;
  submitValues(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
  ): Promise<{ response: Response; result: any }>;
};

export class FormPersistenceRuntime {
  options: TFormPersistenceRuntimeOptions;
  storageAdapter: TFormStorageAdapter | null;
  draftSaveTimer: number | null;
  syncInFlight: boolean;
  onlineHandler: (() => void) | null;

  constructor(options: TFormPersistenceRuntimeOptions) {
    this.options = options;
    this.storageAdapter = null;
    this.draftSaveTimer = null;
    this.syncInFlight = false;
    this.onlineHandler = null;
  }

  setFormConfig(formConfig: TFormConfig | null): void {
    this.storageAdapter = createStorageAdapter(formConfig);
  }

  disconnect(): void {
    if (this.draftSaveTimer !== null) {
      window.clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }

    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
      this.onlineHandler = null;
    }
  }

  connect(): void {
    if (!this.onlineHandler) {
      this.onlineHandler = () => {
        void this.flushSubmissionQueue();
      };
      window.addEventListener("online", this.onlineHandler);
    }

    void this.flushSubmissionQueue();
  }

  async hydrateStorage(): Promise<TStorageHydrationResult | null> {
    if (!this.storageAdapter?.hydrate) {
      return null;
    }

    const hydrationResult = await this.storageAdapter.hydrate();

    if (hydrationResult.migratedFromLocalStorage) {
      this.options.emitEvent(
        "form-ui:storage-migrated",
        this.createEventDetail(this.options.getValues(), {
          source: hydrationResult.source,
          migratedFromLocalStorage: true,
        }),
      );
    }

    return hydrationResult;
  }

  loadDraftValues(): Record<string, any> {
    return getRestorableStorageValues(this.storageAdapter?.loadDraft() || null);
  }

  getDraftAutoSaveMs(): number {
    return this.options.getFormConfig()?.storage?.autoSaveMs ?? 300;
  }

  getResumeStorageKey(token: string): string | null {
    const formName = this.options.getFormConfig()?.name;
    if (!formName) {
      return null;
    }

    return `xpressui:resume:${formName}:${token}`;
  }

  getResumeStoragePrefix(): string | null {
    const formName = this.options.getFormConfig()?.name;
    if (!formName) {
      return null;
    }

    return `xpressui:resume:${formName}:`;
  }

  getResumeCreatePayload(snapshot: TFormStorageSnapshot): Record<string, any> {
    return {
      formName: this.options.getFormConfig()?.name,
      snapshot,
    };
  }

  getCurrentStepStorageKey(): string | null {
    const formConfig = this.options.getFormConfig();
    if (!formConfig) {
      return null;
    }

    const baseKey = formConfig.storage?.key || `xpressui:draft:${formConfig.name}`;
    return `${baseKey}:step`;
  }

  loadCurrentStepIndex(): number | null {
    if (typeof window === "undefined") {
      return null;
    }

    const key = this.getCurrentStepStorageKey();
    if (!key) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) {
        return null;
      }

      const parsed = Number(raw);
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
    } catch {
      return null;
    }
  }

  saveCurrentStepIndex(index?: number | null): void {
    if (typeof window === "undefined") {
      return;
    }

    const key = this.getCurrentStepStorageKey();
    if (!key) {
      return;
    }

    if (typeof index !== "number" || !Number.isInteger(index) || index < 0) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore storage write failures.
      }
      return;
    }

    try {
      window.localStorage.setItem(key, String(index));
    } catch {
      // Ignore storage write failures.
    }
  }

  getResumeTokenTtlMs(): number | null {
    const retentionDays = this.options.getFormConfig()?.storage?.resumeTokenTtlDays;
    return typeof retentionDays === "number" && retentionDays > 0
      ? retentionDays * 24 * 60 * 60 * 1000
      : null;
  }

  isResumeTokenExpired(savedAt?: number): boolean {
    const ttlMs = this.getResumeTokenTtlMs();
    if (!ttlMs || typeof savedAt !== "number") {
      return false;
    }

    return Date.now() - savedAt > ttlMs;
  }

  getResumeEndpoint(): string | undefined {
    return this.options.getFormConfig()?.storage?.resumeEndpoint;
  }

  parseResumeToken(token: string, raw: string | null): (TResumeTokenInfo & {
    snapshot: TFormStorageSnapshot | null;
  }) | null {
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<TResumeTokenState>;
      const snapshot =
        parsed?.snapshot && typeof parsed.snapshot === "object"
          ? parsed.snapshot
          : null;
      const savedAt = typeof parsed?.savedAt === "number" ? parsed.savedAt : 0;
      const expired = this.isResumeTokenExpired(savedAt);

      return {
        token,
        savedAt,
        expired,
        resumeEndpoint:
          typeof parsed?.resumeEndpoint === "string"
            ? parsed.resumeEndpoint
            : this.getResumeEndpoint(),
        snapshot,
      };
    } catch {
      return null;
    }
  }

  applyResumeSnapshot(snapshot: TFormStorageSnapshot): Record<string, any> {
    if (this.storageAdapter) {
      if (snapshot.draft) {
        this.storageAdapter.saveDraft(snapshot.draft);
      } else {
        this.storageAdapter.clearDraft();
      }
      this.storageAdapter.saveQueue(Array.isArray(snapshot.queue) ? snapshot.queue : []);
      this.storageAdapter.saveDeadLetterQueue(Array.isArray(snapshot.deadLetter) ? snapshot.deadLetter : []);
    }

    if (typeof snapshot.currentStepIndex === "number") {
      this.saveCurrentStepIndex(snapshot.currentStepIndex);
      this.options.setCurrentStepIndex?.(snapshot.currentStepIndex);
    } else {
      this.saveCurrentStepIndex(null);
    }

    return getRestorableStorageValues(
      snapshot.draft && typeof snapshot.draft === "object" ? snapshot.draft : null,
    );
  }

  getRetryDelayMs(attempts: number): number {
    const baseDelayMs = 1000;
    const maxDelayMs = 30000;
    return Math.min(baseDelayMs * Math.pow(2, Math.max(0, attempts - 1)), maxDelayMs);
  }

  getMaxRetryAttempts(): number {
    return 3;
  }

  getQueueDisabledReason(): string | undefined {
    const formConfig = this.options.getFormConfig();
    if (!formConfig) {
      return undefined;
    }

    const hasFileFields = Object.values(formConfig.sections || {})
      .flat()
      .some((field) => isFileFieldType(field.type));

    if (hasFileFields) {
      return "file-uploads-are-not-queued";
    }

    return undefined;
  }

  shouldUseQueue(): boolean {
    const mode = this.options.getFormConfig()?.storage?.mode;
    if (this.getQueueDisabledReason()) {
      return false;
    }

    return mode === "queue" || mode === "draft-and-queue";
  }

  createEventDetail(
    values: Record<string, any>,
    result?: any,
    response?: Response,
    error?: unknown,
  ): Record<string, any> {
    const formConfig = this.options.getFormConfig();
    return {
      values,
      formConfig,
      submit: formConfig?.submit,
      result,
      response,
      error,
    };
  }

  emitDraftRestored(values: Record<string, any>): void {
    this.options.emitEvent("form-ui:draft-restored", this.createEventDetail(values));
  }

  saveDraft(values?: Record<string, any>): void {
    if (!this.storageAdapter) {
      return;
    }

    const draftValues = values || this.options.getValues();
    this.storageAdapter.saveDraft(draftValues);
    this.saveCurrentStepIndex(this.options.getCurrentStepIndex?.() ?? null);
    this.options.emitEvent("form-ui:draft-saved", this.createEventDetail(draftValues));
  }

  scheduleDraftSave(): void {
    if (!this.storageAdapter) {
      return;
    }

    if (this.draftSaveTimer !== null) {
      window.clearTimeout(this.draftSaveTimer);
    }

    this.draftSaveTimer = window.setTimeout(() => {
      this.saveDraft();
      this.draftSaveTimer = null;
    }, this.getDraftAutoSaveMs());
  }

  clearDraft(): void {
    if (!this.storageAdapter) {
      return;
    }

    if (this.draftSaveTimer !== null) {
      window.clearTimeout(this.draftSaveTimer);
      this.draftSaveTimer = null;
    }

    this.storageAdapter.clearDraft();
    this.saveCurrentStepIndex(null);
    this.options.emitEvent("form-ui:draft-cleared", this.createEventDetail({}));
  }

  enqueueSubmission(values: Record<string, any>): void {
    if (!this.storageAdapter || !this.shouldUseQueue()) {
      return;
    }

    const queue = this.storageAdapter.enqueueSubmission(values);
    const nextEntry = queue[0];
    this.options.emitEvent(
      "form-ui:queued",
      this.createEventDetail(values, {
        queueLength: queue.length,
        deadLetterLength: this.storageAdapter.loadDeadLetterQueue().length,
        nextAttemptAt: nextEntry?.nextAttemptAt,
        attempts: nextEntry?.attempts,
      } satisfies TFormQueueState),
    );
    this.emitQueueState();
  }

  getQueueState(): TFormQueueState {
    const queue = this.storageAdapter?.loadQueue() || [];
    const nextEntry = queue[0];
    return {
      queueLength: queue.length,
      deadLetterLength: this.storageAdapter?.loadDeadLetterQueue().length || 0,
      nextAttemptAt: nextEntry?.nextAttemptAt,
      attempts: nextEntry?.attempts,
      disabledReason: this.getQueueDisabledReason(),
    };
  }

  emitQueueState(): void {
    const mode = this.options.getFormConfig()?.storage?.mode;
    const storageEnabled = mode === "queue" || mode === "draft-and-queue";
    if (!storageEnabled) {
      return;
    }

    this.options.emitEvent(
      "form-ui:queue-state",
      this.createEventDetail(this.options.getValues(), this.getQueueState()),
    );
  }

  getStorageSnapshot(): TFormStorageSnapshot {
    return {
      draft: this.storageAdapter?.loadDraft() || null,
      queue: this.storageAdapter?.loadQueue() || [],
      deadLetter: this.storageAdapter?.loadDeadLetterQueue() || [],
      currentStepIndex: this.loadCurrentStepIndex() ?? undefined,
    };
  }

  createResumeToken(): string | null {
    if (typeof window === "undefined") {
      return null;
    }

    const token = generateRuntimeId();
    const key = this.getResumeStorageKey(token);
    if (!key) {
      return null;
    }

    const currentValues = this.options.getValues();
    const storageSnapshot = this.storageAdapter ? this.getStorageSnapshot() : null;
    const snapshot = storageSnapshot
      ? {
          ...storageSnapshot,
          draft:
            storageSnapshot.draft ||
            (Object.keys(currentValues).length
              ? getSerializableStorageValues(currentValues)
              : null),
        }
      : {
          draft: Object.keys(currentValues).length
            ? getSerializableStorageValues(currentValues)
            : null,
          queue: [],
          deadLetter: [],
        };

    const state: TResumeTokenState = {
      version: 1,
      savedAt: Date.now(),
      snapshot,
      resumeEndpoint: this.getResumeEndpoint(),
    };

    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      this.options.emitEvent(
        "form-ui:resume-token-created",
        this.createEventDetail(currentValues, {
          token,
          savedAt: state.savedAt,
          resumeEndpoint: state.resumeEndpoint,
        }),
      );
      return token;
    } catch {
      return null;
    }
  }

  async createResumeTokenAsync(): Promise<string | null> {
    const resumeEndpoint = this.getResumeEndpoint();
    if (!resumeEndpoint) {
      return this.createResumeToken();
    }

    const currentValues = this.options.getValues();
    const storageSnapshot = this.storageAdapter ? this.getStorageSnapshot() : null;
    const snapshot = storageSnapshot
      ? {
          ...storageSnapshot,
          draft:
            storageSnapshot.draft ||
            (Object.keys(currentValues).length
              ? getSerializableStorageValues(currentValues)
              : null),
        }
      : {
          draft: Object.keys(currentValues).length
            ? getSerializableStorageValues(currentValues)
            : null,
          queue: [],
          deadLetter: [],
        };

    try {
      const response = await fetch(resumeEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(this.getResumeCreatePayload(snapshot)),
      });
      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      if (!response.ok || !result || typeof result !== "object" || typeof result.token !== "string") {
        throw new Error("Invalid remote resume token response");
      }

      this.options.emitEvent(
        "form-ui:resume-token-created",
        this.createEventDetail(currentValues, {
          token: result.token,
          savedAt: typeof result.savedAt === "number" ? result.savedAt : Date.now(),
          resumeEndpoint,
          remote: true,
        }, response),
      );
      return result.token;
    } catch {
      return null;
    }
  }

  restoreFromResumeToken(token: string): Record<string, any> | null {
    if (typeof window === "undefined") {
      return null;
    }

    const key = this.getResumeStorageKey(token);
    if (!key) {
      return null;
    }

    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        return null;
      }

      const parsed = this.parseResumeToken(token, raw);
      if (!parsed?.snapshot) {
        return null;
      }
      if (parsed.expired) {
        this.deleteResumeToken(token);
        this.options.emitEvent(
          "form-ui:resume-token-expired",
          this.createEventDetail({}, {
            token,
            savedAt: parsed.savedAt,
            resumeEndpoint: parsed.resumeEndpoint,
          }),
        );
        return null;
      }
      const snapshot = parsed.snapshot;

      const restoredDraft = this.applyResumeSnapshot(snapshot);
      this.options.emitEvent(
        "form-ui:resume-token-restored",
        this.createEventDetail(restoredDraft, {
          token,
          snapshot,
          savedAt: parsed.savedAt,
          resumeEndpoint: parsed.resumeEndpoint,
        }),
      );
      return restoredDraft;
    } catch {
      return null;
    }
  }

  async lookupResumeToken(token: string): Promise<TResumeLookupResult | null> {
    const resumeEndpoint = this.getResumeEndpoint();
    if (!resumeEndpoint) {
      const key = this.getResumeStorageKey(token);
      if (!key) {
        return null;
      }

      const parsed = this.parseResumeToken(token, window.localStorage.getItem(key));
      if (!parsed) {
        return null;
      }
      if (parsed.expired) {
        this.deleteResumeToken(token);
        return null;
      }

      return {
        token: parsed.token,
        savedAt: parsed.savedAt,
        expired: false,
        resumeEndpoint: parsed.resumeEndpoint,
        snapshot: parsed.snapshot,
      };
    }

    try {
      const response = await fetch(
        `${resumeEndpoint}${resumeEndpoint.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`,
        { method: "GET" },
      );
      const contentType = response.headers.get("content-type") || "";
      const result = contentType.includes("application/json")
        ? await response.json()
        : null;
      if (!response.ok || !result || typeof result !== "object") {
        return null;
      }

      return {
        token: typeof result.token === "string" ? result.token : token,
        savedAt: typeof result.savedAt === "number" ? result.savedAt : Date.now(),
        expired: false,
        resumeEndpoint,
        snapshot:
          result.snapshot && typeof result.snapshot === "object"
            ? result.snapshot as TFormStorageSnapshot
            : null,
      };
    } catch {
      return null;
    }
  }

  async restoreFromResumeTokenAsync(token: string): Promise<Record<string, any> | null> {
    const lookup = await this.lookupResumeToken(token);
    if (!lookup) {
      return null;
    }

    if (lookup.resumeEndpoint && lookup.snapshot) {
      const restoredDraft = this.applyResumeSnapshot(lookup.snapshot);
      this.options.emitEvent(
        "form-ui:resume-token-restored",
        this.createEventDetail(restoredDraft, {
          token: lookup.token,
          snapshot: lookup.snapshot,
          savedAt: lookup.savedAt,
          resumeEndpoint: lookup.resumeEndpoint,
          remote: true,
        }),
      );
      return restoredDraft;
    }

    return this.restoreFromResumeToken(token);
  }

  listResumeTokens(): TResumeTokenInfo[] {
    if (typeof window === "undefined") {
      return [];
    }

    const prefix = this.getResumeStoragePrefix();
    if (!prefix) {
      return [];
    }

    const tokens: TResumeTokenInfo[] = [];
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(prefix)) {
        continue;
      }

      const token = key.slice(prefix.length);
      const parsed = this.parseResumeToken(token, window.localStorage.getItem(key));
      if (!parsed) {
        window.localStorage.removeItem(key);
        continue;
      }

      if (parsed.expired) {
        window.localStorage.removeItem(key);
        continue;
      }

      tokens.push({
        token: parsed.token,
        savedAt: parsed.savedAt,
        expired: false,
        resumeEndpoint: parsed.resumeEndpoint,
      });
    }

    return tokens.sort((left, right) => right.savedAt - left.savedAt);
  }

  deleteResumeToken(token: string): boolean {
    if (typeof window === "undefined") {
      return false;
    }

    const key = this.getResumeStorageKey(token);
    if (!key || !window.localStorage.getItem(key)) {
      return false;
    }

    window.localStorage.removeItem(key);
    this.options.emitEvent(
      "form-ui:resume-token-deleted",
      this.createEventDetail(this.options.getValues(), {
        token,
      }),
    );
    return true;
  }

  getStorageHealth(): TFormStorageHealth {
    const storageHealth = this.storageAdapter?.getHealth() || {
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
    };

    return {
      ...storageHealth,
      queueDisabledReason: this.getQueueDisabledReason(),
      queueEnabled: this.shouldUseQueue(),
    };
  }

  clearDeadLetterQueue(): void {
    if (!this.storageAdapter) {
      return;
    }

    this.storageAdapter.clearDeadLetterQueue();
    this.options.emitEvent(
      "form-ui:dead-letter-cleared",
      this.createEventDetail({}, this.getQueueState()),
    );
    this.emitQueueState();
  }

  requeueDeadLetterEntry(entryId: string): boolean {
    if (!this.storageAdapter) {
      return false;
    }

    const entry = this.storageAdapter.removeDeadLetterEntry(entryId);
    if (!entry) {
      return false;
    }

    const resetEntry = entry.values;
    const queue = this.storageAdapter.enqueueSubmission(resetEntry);
    this.options.emitEvent(
      "form-ui:dead-letter-requeued",
      this.createEventDetail(resetEntry, {
        queueLength: queue.length,
        deadLetterLength: this.storageAdapter.loadDeadLetterQueue().length,
        entryId,
      }),
    );
    this.emitQueueState();
    return true;
  }

  async replayDeadLetterEntry(entryId: string): Promise<boolean> {
    const formConfig = this.options.getFormConfig();
    if (!this.storageAdapter || !formConfig?.submit?.endpoint) {
      return false;
    }

    const entry = this.storageAdapter.removeDeadLetterEntry(entryId);
    if (!entry) {
      return false;
    }

    try {
      const { response, result } = await this.options.submitValues(entry.values, formConfig.submit);
      this.options.emitEvent(
        "form-ui:dead-letter-replayed-success",
        this.createEventDetail(entry.values, result, response),
      );
      this.emitQueueState();
      return true;
    } catch (error: any) {
      const replayEntry: TQueuedSubmission = {
        ...entry,
        attempts: entry.attempts + 1,
        updatedAt: Date.now(),
        nextAttemptAt: Date.now() + this.getRetryDelayMs(entry.attempts + 1),
        lastError: error?.result?.message || error?.message || "replay_error",
      };
      const deadLetter = this.storageAdapter.enqueueDeadLetter(replayEntry);
      this.options.emitEvent(
        "form-ui:dead-letter-replayed-error",
        this.createEventDetail(
          entry.values,
          {
            deadLetterLength: deadLetter.length,
            entry: replayEntry,
          },
          error?.response,
          error,
        ),
      );
      this.emitQueueState();
      return false;
    }
  }

  async flushSubmissionQueue(): Promise<void> {
    const formConfig = this.options.getFormConfig();
    if (
      !this.storageAdapter ||
      !formConfig?.submit?.endpoint ||
      !this.shouldUseQueue() ||
      this.syncInFlight
    ) {
      return;
    }

    const pending = this.storageAdapter.loadQueue();
    if (!pending.length) {
      return;
    }

    this.syncInFlight = true;
    try {
      while (true) {
        const entry = this.storageAdapter.loadQueue()[0];
        if (!entry) {
          this.emitQueueState();
          break;
        }

        if (entry.nextAttemptAt > Date.now()) {
          break;
        }

        try {
          const { response, result } = await this.options.submitValues(entry.values, formConfig.submit);
          this.storageAdapter.dequeueSubmission();
          this.options.emitEvent(
            "form-ui:sync-success",
            this.createEventDetail(entry.values, result, response),
          );
          this.emitQueueState();
        } catch (error: any) {
          const attempts = entry.attempts + 1;
          const nextEntry: TQueuedSubmission = {
            ...entry,
            attempts,
            updatedAt: Date.now(),
            nextAttemptAt: Date.now() + this.getRetryDelayMs(attempts),
            lastError: error?.result?.message || error?.message || "sync_error",
          };
          if (attempts >= this.getMaxRetryAttempts()) {
            this.storageAdapter.dequeueSubmission();
            const deadLetter = this.storageAdapter.enqueueDeadLetter(nextEntry);
            this.options.emitEvent(
              "form-ui:dead-lettered",
              this.createEventDetail(
                entry.values,
                {
                  deadLetterLength: deadLetter.length,
                  entry: nextEntry,
                },
                error?.response,
                error,
              ),
            );
          } else {
            this.storageAdapter.updateQueueEntry(nextEntry);
          }
          this.options.emitEvent(
            "form-ui:sync-error",
            this.createEventDetail(entry.values, error?.result, error?.response, error),
          );
          this.emitQueueState();
          break;
        }
      }
    } finally {
      this.syncInFlight = false;
    }
  }
}
