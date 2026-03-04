import {
  attachFormDebugObserver,
  TFormDebugObserver,
} from "./form-debug";

export type TFormDebugPanel = {
  element: HTMLElement;
  observer: TFormDebugObserver;
  refresh(): void;
  clearSnapshot(): void;
  detach(): void;
};

export type TFormDebugPanelOptions = {
  maxEvents?: number;
  className?: string;
  title?: string;
};

export function createFormDebugPanel(
  target: EventTarget,
  options: TFormDebugPanelOptions = {},
): TFormDebugPanel {
  const element = document.createElement("section");
  element.className = options.className || "xpressui-debug-panel";

  const title = document.createElement("strong");
  title.textContent = options.title || "Form Debug";

  const snapshot = document.createElement("pre");
  snapshot.className = "xpressui-debug-panel__snapshot";

  element.appendChild(title);
  element.appendChild(snapshot);

  const render = () => {
    snapshot.textContent = JSON.stringify({
      snapshot: observer.getSnapshot(),
      counts: {
        events: observer.getEvents().length,
        ruleHistory: observer.getRuleHistory().length,
        templateDiagnostics: observer.getTemplateDiagnostics().length,
      },
    }, null, 2);
  };

  const observer = attachFormDebugObserver(target, {
    maxEvents: options.maxEvents,
    onEvent: () => render(),
  });

  render();

  return {
    element,
    observer,
    refresh() {
      render();
    },
    clearSnapshot() {
      observer.clearSnapshot();
      render();
    },
    detach() {
      observer.detach();
      element.remove();
    },
  };
}
