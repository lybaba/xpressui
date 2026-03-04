import TFormConfig, { TFormSubmitRequest } from "./TFormConfig";
import { isFileFieldType } from "./field";
import {
  createStorageAdapter,
  getRestorableStorageValues,
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
};

type TFormPersistenceRuntimeOptions = {
  getFormConfig(): TFormConfig | null;
  getValues(): Record<string, any>;
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

  loadDraftValues(): Record<string, any> {
    return getRestorableStorageValues(this.storageAdapter?.loadDraft() || null);
  }

  getDraftAutoSaveMs(): number {
    return this.options.getFormConfig()?.storage?.autoSaveMs ?? 300;
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
