import { vi } from "vitest";

export function renderFixture(markup: string): HTMLElement {
  document.body.innerHTML = markup;
  return document.querySelector("form-ui") as HTMLElement;
}

export function normalizeLocalStorageApi() {
  const existing = (() => {
    try {
      return window.localStorage as Storage | null;
    } catch {
      return null;
    }
  })();
  if (
    existing &&
    typeof existing.getItem === "function" &&
    typeof existing.setItem === "function" &&
    typeof existing.removeItem === "function" &&
    typeof existing.clear === "function"
  ) {
    return;
  }

  const values: Record<string, string> = {};
  const memoryStorage: Storage = {
    get length() {
      return Object.keys(values).length;
    },
    clear: () => {
      Object.keys(values).forEach((key) => delete values[key]);
    },
    getItem: (key: string) => (Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null),
    key: (index: number) => Object.keys(values)[index] || null,
    removeItem: (key: string) => {
      delete values[key];
    },
    setItem: (key: string, value: string) => {
      values[key] = String(value);
    },
  };

  try {
    Object.defineProperty(window, "localStorage", {
      value: memoryStorage,
      configurable: true,
    });
  } catch {
    (window as any).localStorage = memoryStorage;
  }
}

export function resetDomAndStorage() {
  normalizeLocalStorageApi();
  document.body.innerHTML = "";
  const storage = window.localStorage as Storage | Record<string, any> | null;
  if (storage && typeof (storage as Storage).clear === "function") {
    (storage as Storage).clear();
  } else if (storage) {
    Object.keys(storage).forEach((key) => {
      delete (storage as Record<string, any>)[key];
    });
  }
  vi.spyOn(console, "log").mockImplementation(() => {});
}

export async function flushAsyncWork() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  await new Promise((resolve) => setTimeout(resolve, 10));
}
