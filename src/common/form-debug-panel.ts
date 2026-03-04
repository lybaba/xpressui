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

  const counts = document.createElement("div");
  counts.className = "xpressui-debug-panel__counts";

  const status = document.createElement("div");
  status.className = "xpressui-debug-panel__status";

  const lastUpdated = document.createElement("div");
  lastUpdated.className = "xpressui-debug-panel__updated";

  const actions = document.createElement("div");
  actions.className = "xpressui-debug-panel__actions";

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "xpressui-debug-panel__clear";
  clearButton.textContent = "Clear Snapshot";

  const clearEventsButton = document.createElement("button");
  clearEventsButton.type = "button";
  clearEventsButton.className = "xpressui-debug-panel__clear-events";
  clearEventsButton.textContent = "Clear Events";

  const rulesTitle = document.createElement("strong");
  rulesTitle.textContent = "Recent Rules";

  const rules = document.createElement("pre");
  rules.className = "xpressui-debug-panel__rules";

  const warningsTitle = document.createElement("strong");
  warningsTitle.textContent = "Active Template Warnings";

  const warnings = document.createElement("pre");
  warnings.className = "xpressui-debug-panel__warnings";

  const workflowTitle = document.createElement("strong");
  workflowTitle.textContent = "Workflow";

  const workflow = document.createElement("pre");
  workflow.className = "xpressui-debug-panel__workflow";

  const outputSnapshotTitle = document.createElement("strong");
  outputSnapshotTitle.textContent = "Output Snapshot";

  const outputSnapshot = document.createElement("pre");
  outputSnapshot.className = "xpressui-debug-panel__output-snapshot";

  element.appendChild(title);
  element.appendChild(counts);
  element.appendChild(status);
  element.appendChild(lastUpdated);
  actions.appendChild(clearButton);
  actions.appendChild(clearEventsButton);
  element.appendChild(actions);
  element.appendChild(rulesTitle);
  element.appendChild(rules);
  element.appendChild(warningsTitle);
  element.appendChild(warnings);
  element.appendChild(workflowTitle);
  element.appendChild(workflow);
  element.appendChild(outputSnapshotTitle);
  element.appendChild(outputSnapshot);

  const render = () => {
    const snapshot = observer.getSnapshot();
    counts.textContent = [
      `events: ${observer.getEvents().length}`,
      `ruleHistory: ${observer.getRuleHistory().length}`,
      `templateDiagnostics: ${observer.getTemplateDiagnostics().length}`,
    ].join(" | ");
    status.textContent = "Status: listening";
    const latestEvent = observer.getEvents().at(-1);
    lastUpdated.textContent = latestEvent
      ? `Last Updated: ${new Date(latestEvent.timestamp).toISOString()}`
      : "Last Updated: never";
    rules.textContent = JSON.stringify(snapshot.recentAppliedRules, null, 2);
    warnings.textContent = JSON.stringify(snapshot.activeTemplateWarnings, null, 2);
    const workflowEvents = observer
      .getEvents()
      .filter((event) => event.type === "form-ui:workflow-step" || event.type === "form-ui:workflow-state");
    workflow.textContent = JSON.stringify(workflowEvents.at(-1)?.detail?.result || null, null, 2);
    outputSnapshot.textContent = JSON.stringify(snapshot.lastOutputSnapshot?.detail?.result || null, null, 2);
  };

  const observer = attachFormDebugObserver(target, {
    maxEvents: options.maxEvents,
    onEvent: () => render(),
  });

  clearButton.addEventListener("click", () => {
    observer.clearSnapshot();
    render();
  });

  clearEventsButton.addEventListener("click", () => {
    observer.clear();
    render();
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
      status.textContent = "Status: detached";
      observer.detach();
      element.remove();
    },
  };
}
