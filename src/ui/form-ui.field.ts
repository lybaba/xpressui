import { getErrorClass } from "../dom-utils";

export function getFieldElement(
  host: ParentNode,
  fieldName: string,
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  const nodes = Array.from(host.querySelectorAll("[id]"));
  for (const node of nodes) {
    if ((node as HTMLElement).id === fieldName) {
      return node as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    }
  }

  return null;
}

export function getFieldContainer(host: ParentNode, fieldName: string): HTMLElement | null {
  const fieldElement = getFieldElement(host, fieldName);
  if (!fieldElement) {
    return null;
  }

  const closestLabel = fieldElement.closest("label");
  if (closestLabel) {
    return closestLabel as HTMLElement;
  }

  return fieldElement.parentElement as HTMLElement | null;
}

export function renderFieldErrorState(options: {
  fieldName: string;
  inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  errorElement: HTMLElement | null;
  touched?: boolean;
  error?: unknown;
  errors: Record<string, boolean>;
  ruleFieldErrors: Record<string, string>;
}): void {
  const { fieldName, inputElement, errorElement } = options;
  if (!errorElement || !inputElement) {
    return;
  }

  const ruleError = options.ruleFieldErrors[fieldName];
  const displayedError = ruleError || (options.touched ? options.error : undefined);
  if (displayedError) {
    const errorClass = getErrorClass(inputElement);
    const errorMessage =
      typeof displayedError === "object" && displayedError && "errorMessage" in (displayedError as Record<string, any>)
        ? String((displayedError as Record<string, any>).errorMessage || "")
        : String(displayedError);
    errorElement.innerHTML = ruleError ? ruleError : errorMessage;
    errorElement.style.display = "block";
    inputElement.classList.add(errorClass);
    options.errors[fieldName] = true;
    return;
  }

  if (options.errors[fieldName]) {
    errorElement.innerHTML = "";
    errorElement.style.display = "none";
    const errorClass = getErrorClass(inputElement);
    inputElement.classList.remove(errorClass);
  }
  options.errors[fieldName] = false;
}
