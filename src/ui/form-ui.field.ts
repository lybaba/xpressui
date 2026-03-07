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

export function bindSimpleFieldEvents(options: {
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  fieldConfig: { name: string };
  onBlur: () => void;
  onFocus: () => void;
  onChangeValue: (value: any) => void | Promise<void>;
  onAfterChange: () => void;
  resolveFileInputValue: (
    fieldConfig: { name: string },
    input: HTMLInputElement,
  ) => Promise<any>;
}): void {
  const { input, fieldConfig } = options;

  input.addEventListener("blur", () => options.onBlur());
  input.addEventListener("input", (event: Event) => {
    if (input instanceof HTMLInputElement && input.type === "file") {
      return;
    }

    const nextValue =
      input instanceof HTMLInputElement && input.type === "checkbox"
        ? (event.target as HTMLInputElement | null)?.checked
        : input instanceof HTMLSelectElement && input.multiple
          ? Array.from((event.target as HTMLSelectElement | null)?.selectedOptions || []).map(
              (option) => option.value,
            )
          : (event.target as HTMLInputElement | HTMLTextAreaElement | null)?.value;
    void options.onChangeValue(nextValue);
    options.onAfterChange();
  });
  input.addEventListener("change", async () => {
    if (input instanceof HTMLInputElement && input.type === "file") {
      const nextValue = await options.resolveFileInputValue(fieldConfig, input);
      await options.onChangeValue(nextValue);
    }
    options.onAfterChange();
  });
  input.addEventListener("focus", () => options.onFocus());
}

export function bindSelectionFieldEvents(options: {
  selectionElement: HTMLElement;
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  fieldConfig: { name: string; type?: string };
  isFileField: boolean;
  isProductListField: boolean;
  isImageGalleryField: boolean;
  getCurrentValue: () => any;
  onChangeValue: (value: any) => void;
  onAfterChange: () => void;
  getNextProductCartItems: (action: "add" | "inc" | "dec" | "remove", productId: string) => any;
  getNextImageGallerySelectionItems: (action: "toggle" | "remove", imageId: string) => any;
  openProductGallery: (productId: string) => void;
  openImageGallery: (imageId: string) => void;
  startQrCamera: () => void;
  scanQrCamera: () => void;
  stopQrCamera: () => void;
  setActiveDocumentScanSlot: (slotIndex: number) => void;
  refreshSelection: () => void;
  removeSelectedFile: (fileIndex: number) => void;
  setFileDragState: (active: boolean) => void;
  applyDroppedFiles: (files: File[]) => void;
}): void {
  const {
    selectionElement,
    input,
  } = options;

  selectionElement.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;

    const productActionButton = target?.closest("[data-product-action]") as HTMLElement | null;
    if (options.isProductListField && productActionButton) {
      event.preventDefault();
      event.stopPropagation();
      const action = productActionButton.getAttribute("data-product-action");
      const productId = productActionButton.getAttribute("data-product-id");
      if ((action === "add" || action === "inc" || action === "dec" || action === "remove") && productId) {
        options.onChangeValue(options.getNextProductCartItems(action, productId));
        options.onAfterChange();
      }
      return;
    }

    const imageGalleryActionButton = target?.closest("[data-image-gallery-action]") as HTMLElement | null;
    if (options.isImageGalleryField && imageGalleryActionButton) {
      event.preventDefault();
      event.stopPropagation();
      const action = imageGalleryActionButton.getAttribute("data-image-gallery-action");
      const imageId = imageGalleryActionButton.getAttribute("data-image-id");
      if ((action === "toggle" || action === "remove") && imageId) {
        options.onChangeValue(options.getNextImageGallerySelectionItems(action, imageId));
        options.onAfterChange();
      }
      return;
    }

    if (options.isProductListField) {
      const productCard = target?.closest("[data-product-open-gallery]") as HTMLElement | null;
      if (productCard) {
        const productId = productCard.getAttribute("data-product-open-gallery");
        if (productId) {
          event.preventDefault();
          event.stopPropagation();
          options.openProductGallery(productId);
        }
        return;
      }
    }

    if (options.isImageGalleryField) {
      const imageCard = target?.closest("[data-image-open-gallery]") as HTMLElement | null;
      if (imageCard) {
        const imageId = imageCard.getAttribute("data-image-open-gallery");
        if (imageId) {
          event.preventDefault();
          event.stopPropagation();
          options.openImageGallery(imageId);
        }
        return;
      }
    }

    const qrAction = target?.closest("[data-qr-action]") as HTMLElement | null;
    if (qrAction) {
      event.preventDefault();
      event.stopPropagation();
      const action = qrAction.getAttribute("data-qr-action");
      if (action === "start") {
        options.startQrCamera();
      } else if (action === "scan") {
        options.scanQrCamera();
      } else if (action === "stop") {
        options.stopQrCamera();
      }
      return;
    }

    const documentScanSlotButton = target?.closest("[data-document-scan-slot]") as HTMLElement | null;
    if (documentScanSlotButton) {
      event.preventDefault();
      event.stopPropagation();
      const slotIndex = Number(documentScanSlotButton.getAttribute("data-document-scan-slot"));
      if (!Number.isNaN(slotIndex)) {
        options.setActiveDocumentScanSlot(slotIndex);
        options.refreshSelection();
        if (input instanceof HTMLInputElement && input.type === "file") {
          input.click();
        }
      }
      return;
    }

    const removeButton = target?.closest("[data-remove-file-index]") as HTMLElement | null;
    if (!removeButton) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const fileIndex = Number(removeButton.getAttribute("data-remove-file-index"));
    if (Number.isNaN(fileIndex)) {
      return;
    }

    options.removeSelectedFile(fileIndex);
  });

  if (!options.isFileField) {
    return;
  }

  selectionElement.addEventListener("dragenter", (event) => {
    event.preventDefault();
    options.setFileDragState(true);
  });
  selectionElement.addEventListener("dragover", (event) => {
    event.preventDefault();
    options.setFileDragState(true);
  });
  selectionElement.addEventListener("dragleave", (event) => {
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && selectionElement.contains(relatedTarget)) {
      return;
    }
    options.setFileDragState(false);
  });
  selectionElement.addEventListener("drop", (event) => {
    event.preventDefault();
    options.setFileDragState(false);
    const droppedFiles = Array.from(event.dataTransfer?.files || []);
    options.applyDroppedFiles(droppedFiles);
  });
}
