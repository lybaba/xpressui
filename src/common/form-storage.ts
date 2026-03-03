import TFormConfig, { TFormStorageConfig } from "./TFormConfig";

export interface TFormStorageAdapter {
  loadDraft(): Record<string, any> | null;
  saveDraft(values: Record<string, any>): void;
  clearDraft(): void;
}

function getDraftKey(formConfig: TFormConfig, storage: TFormStorageConfig): string {
  return storage.key || `xpressui:draft:${formConfig.name}`;
}

export class LocalStorageAdapter implements TFormStorageAdapter {
  storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
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
}

export function createStorageAdapter(
  formConfig: TFormConfig | null,
): TFormStorageAdapter | null {
  if (!formConfig?.storage || typeof window === "undefined") {
    return null;
  }

  const storage = formConfig.storage;
  const shouldStoreDraft =
    storage.mode === "draft" || storage.mode === "draft-and-queue";
  if (!shouldStoreDraft) {
    return null;
  }

  const adapter = storage.adapter || "local-storage";
  if (adapter === "local-storage") {
    return new LocalStorageAdapter(getDraftKey(formConfig, storage));
  }

  return null;
}
