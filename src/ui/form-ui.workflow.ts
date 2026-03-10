import type TFieldConfig from "../common/TFieldConfig";
import type TFormConfig from "../common/TFormConfig";
import type { TFormStepProgress } from "../common/form-steps";

export type TStepControlElements = {
  container: HTMLElement | null;
  progress: HTMLElement | null;
  summary: HTMLElement | null;
  backButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
};

export function getStepButtonLabels(
  formConfig: TFormConfig | null,
): { previous: string; next: string } {
  return {
    previous: formConfig?.navigationLabels?.prevLabel || "Back",
    next: formConfig?.navigationLabels?.nextLabel || "Next",
  };
}

export function getCurrentStepFieldElements(
  host: ParentNode,
  currentStepName: string | null,
): Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  if (!currentStepName) {
    return [];
  }

  return Array.from(
    host.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
      "input[data-section-name], select[data-section-name], textarea[data-section-name]",
    ),
  ).filter((element) => element.getAttribute("data-section-name") === currentStepName);
}

export function getStepElements(host: ParentNode, sectionName: string): HTMLElement[] {
  const fieldNodes = Array.from(host.querySelectorAll("[data-section-name]"))
    .filter((node) => node.getAttribute("data-section-name") === sectionName)
    .map((node) => (node.closest("label") as HTMLElement | null) || node as HTMLElement);
  const sectionNodes = Array.from(host.querySelectorAll('[data-type="section"]'))
    .filter((node) => node.getAttribute("data-name") === sectionName)
    .map((node) => node as HTMLElement);

  return Array.from(new Set([...sectionNodes, ...fieldNodes]));
}

export function ensureStepControls(options: {
  formElem: HTMLFormElement;
  stepCount: number;
  buttonLabels: { previous: string; next: string };
  existing?: TStepControlElements;
  onPrevious: () => void;
  onNext: () => void;
}): TStepControlElements {
  if (options.stepCount <= 1) {
    return {
      container: null,
      progress: null,
      summary: null,
      backButton: null,
      nextButton: null,
    };
  }

  const existingContainer = options.formElem.querySelector("[data-form-step-controls]") as HTMLElement | null;
  if (existingContainer) {
    return {
      container: existingContainer,
      progress: existingContainer.querySelector("[data-form-step-progress]") as HTMLElement | null,
      summary: existingContainer.querySelector("[data-form-step-summary]") as HTMLElement | null,
      backButton: existingContainer.querySelector('[data-step-action="back"]') as HTMLButtonElement | null,
      nextButton: existingContainer.querySelector('[data-step-action="next"]') as HTMLButtonElement | null,
    };
  }

  const controlsContainer = document.createElement("div");
  controlsContainer.setAttribute("data-form-step-controls", "true");
  controlsContainer.className = "mt-4 flex flex-wrap items-center gap-2";
  controlsContainer.style.marginTop = "16px";
  controlsContainer.style.display = "flex";
  controlsContainer.style.flexWrap = "wrap";
  controlsContainer.style.alignItems = "center";
  controlsContainer.style.gap = "8px";

  const progressElement = document.createElement("div");
  progressElement.setAttribute("data-form-step-progress", "true");
  progressElement.className = "text-sm font-medium";
  progressElement.style.fontSize = "14px";
  progressElement.style.fontWeight = "600";

  const summaryElement = document.createElement("div");
  summaryElement.setAttribute("data-form-step-summary", "true");
  summaryElement.className = "text-xs opacity-80";
  summaryElement.style.fontSize = "12px";
  summaryElement.style.opacity = "0.8";
  summaryElement.style.flexBasis = "100%";

  const backButton = document.createElement("button");
  backButton.type = "button";
  backButton.textContent = options.buttonLabels.previous;
  backButton.setAttribute("data-step-action", "back");
  backButton.className = "btn btn-outline btn-sm";
  backButton.addEventListener("click", options.onPrevious);

  const nextButton = document.createElement("button");
  nextButton.type = "button";
  nextButton.textContent = options.buttonLabels.next;
  nextButton.setAttribute("data-step-action", "next");
  nextButton.className = "btn btn-primary btn-sm";
  nextButton.addEventListener("click", options.onNext);

  controlsContainer.appendChild(progressElement);
  controlsContainer.appendChild(summaryElement);
  controlsContainer.appendChild(backButton);
  controlsContainer.appendChild(nextButton);
  options.formElem.appendChild(controlsContainer);

  return {
    container: controlsContainer,
    progress: progressElement,
    summary: summaryElement,
    backButton,
    nextButton,
  };
}

export function syncStepVisibility(options: {
  stepNames: string[];
  currentStepIndex: number;
  getStepElements: (sectionName: string) => HTMLElement[];
}): void {
  if (options.stepNames.length <= 1) {
    return;
  }

  options.stepNames.forEach((sectionName, index) => {
    const isActive = index === options.currentStepIndex;
    options.getStepElements(sectionName).forEach((element) => {
      const isStepHidden = element.getAttribute("data-step-hidden") === "true";
      if (!isActive) {
        element.setAttribute("data-step-hidden", "true");
        element.style.display = "none";
        return;
      }

      if (isStepHidden) {
        element.removeAttribute("data-step-hidden");
        element.style.display = "";
      }
    });
  });
}

export function formatStepSummary(
  summary: Array<{ field: string; label: string; value: any }>,
): string {
  return summary
    .map((entry) => `${entry.label}: ${Array.isArray(entry.value) ? entry.value.join(", ") : String(entry.value)}`)
    .join(" | ");
}

export function syncStepControls(options: {
  formElement: Element | null;
  stepCount: number;
  currentStepIndex: number;
  isLastStep: boolean;
  progress: TFormStepProgress;
  isCurrentStepSkippable: boolean;
  summary: Array<{ field: string; label: string; value: any }>;
  submitLockedByRules: boolean;
  submitLockMessage: string | null;
  controls: TStepControlElements;
}): void {
  if (!options.formElement) {
    return;
  }

  const submitButtons = Array.from(
    options.formElement.querySelectorAll<HTMLButtonElement | HTMLInputElement>(
      'button[type="submit"], input[type="submit"]',
    ),
  );

  if (options.stepCount <= 1) {
    submitButtons.forEach((button) => {
      button.disabled = options.submitLockedByRules;
      (button as HTMLElement).style.display = "";
      if (button instanceof HTMLButtonElement) {
        button.title = options.submitLockedByRules && options.submitLockMessage
          ? options.submitLockMessage
          : "";
      }
    });
    return;
  }

  if (options.controls.progress) {
    const suffix = options.isCurrentStepSkippable ? " (Optional)" : "";
    options.controls.progress.textContent =
      `Step ${options.progress.stepNumber} of ${options.progress.stepCount} (${options.progress.percent}%)${suffix}`;
  }
  if (options.controls.summary) {
    if (!options.summary.length) {
      options.controls.summary.textContent = "";
      options.controls.summary.style.display = "none";
    } else {
      options.controls.summary.textContent = formatStepSummary(options.summary);
      options.controls.summary.style.display = "";
    }
  }
  if (options.controls.backButton) {
    options.controls.backButton.disabled = options.currentStepIndex === 0;
    options.controls.backButton.style.display = options.currentStepIndex === 0 ? "none" : "";
  }
  if (options.controls.nextButton) {
    options.controls.nextButton.disabled = options.isLastStep;
    options.controls.nextButton.style.display = options.isLastStep ? "none" : "";
  }

  submitButtons.forEach((button) => {
    button.disabled = !options.isLastStep || options.submitLockedByRules;
    (button as HTMLElement).style.display = options.isLastStep ? "" : "none";
    if (button instanceof HTMLButtonElement) {
      button.title = options.submitLockedByRules && options.submitLockMessage
        ? options.submitLockMessage
        : "";
    }
  });
}
