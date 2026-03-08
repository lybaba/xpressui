import {
  createFormAdminPanel,
  TFormAdminPanel,
  TFormAdminPanelOptions,
  TFormAdminPanelSource,
} from "./form-admin-panel";
import {
  createFormDebugPanel,
  TFormDebugPanel,
  TFormDebugPanelOptions,
} from "./form-debug-panel";

export type TFormOpsPanel = {
  element: HTMLElement;
  debugPanel: TFormDebugPanel;
  adminPanel: TFormAdminPanel;
  refresh(): void;
  clearSnapshot(): void;
  detach(): void;
};

export type TFormOpsPanelOptions = {
  className?: string;
  layoutClassName?: string;
  title?: string;
  debug?: TFormDebugPanelOptions;
  admin?: TFormAdminPanelOptions;
};

export function createFormOpsPanel(
  target: EventTarget,
  source: TFormAdminPanelSource,
  options: TFormOpsPanelOptions = {},
): TFormOpsPanel {
  const element = document.createElement("section");
  element.className = options.className || "xpressui-ops-panel";

  const title = document.createElement("strong");
  title.textContent = options.title || "Form Ops";

  const layout = document.createElement("div");
  layout.className = options.layoutClassName || "xpressui-ops-panel__layout";

  const debugPanel = createFormDebugPanel(target, {
    title: options.debug?.title || "Debug",
    className: options.debug?.className,
    maxEvents: options.debug?.maxEvents,
  });
  const adminPanel = createFormAdminPanel(source, {
    title: options.admin?.title || "Admin",
    className: options.admin?.className,
    incidentLimit: options.admin?.incidentLimit,
  });

  layout.appendChild(debugPanel.element);
  layout.appendChild(adminPanel.element);
  element.appendChild(title);
  element.appendChild(layout);

  return {
    element,
    debugPanel,
    adminPanel,
    refresh() {
      debugPanel.refresh();
      adminPanel.refresh();
    },
    clearSnapshot() {
      debugPanel.clearSnapshot();
      adminPanel.refresh();
    },
    detach() {
      debugPanel.detach();
      adminPanel.detach();
      element.remove();
    },
  };
}
