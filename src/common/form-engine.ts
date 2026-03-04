import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import validate, { getValidators, TValidator } from "./Validator";
import { isFileFieldType, isFileLikeValue, normalizeFormValues } from "./field";

export type TStoredDocumentData = {
  text?: string | null;
  mrz?: Record<string, any> | null;
  fields?: Record<string, any> | null;
};

function getFileList(value: any): File[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => isFileLikeValue(entry)) as File[];
  }

  return isFileLikeValue(value) ? [value as File] : [];
}

function matchesAcceptToken(file: File, token: string): boolean {
  const normalizedToken = token.trim().toLowerCase();
  if (!normalizedToken) {
    return true;
  }

  const fileName = file.name.toLowerCase();
  const mimeType = (file.type || "").toLowerCase();

  if (normalizedToken.startsWith(".")) {
    return fileName.endsWith(normalizedToken);
  }

  if (normalizedToken.endsWith("/*")) {
    const category = normalizedToken.slice(0, -1);
    return mimeType.startsWith(category);
  }

  return mimeType === normalizedToken;
}

function matchesAccept(file: File, accept?: string): boolean {
  if (!accept) {
    return true;
  }

  return accept
    .split(",")
    .some((token) => matchesAcceptToken(file, token));
}

export class FormEngineRuntime {
  formConfig: TFormConfig | null;
  validators: TValidator[];
  inputFields: Record<string, TFieldConfig>;
  documentData: Record<string, TStoredDocumentData>;

  constructor() {
    this.formConfig = null;
    this.validators = [];
    this.inputFields = {};
    this.documentData = {};
  }

  setFormConfig(formConfig: TFormConfig | null): void {
    this.formConfig = formConfig;
    this.validators = formConfig ? getValidators(formConfig) : [];
  }

  setField(fieldName: string, fieldConfig: TFieldConfig): void {
    this.inputFields[fieldName] = fieldConfig;
  }

  getField(fieldName: string): TFieldConfig | undefined {
    return this.inputFields[fieldName];
  }

  getFields(): Record<string, TFieldConfig> {
    return this.inputFields;
  }

  setDocumentData(fieldName: string, data: TStoredDocumentData): void {
    this.documentData[fieldName] = data;
  }

  getDocumentData(fieldName: string): TStoredDocumentData | null {
    return this.documentData[fieldName] || null;
  }

  getAllDocumentData(): Record<string, TStoredDocumentData> {
    return { ...this.documentData };
  }

  normalizeValues(values: Record<string, any>): Record<string, any> {
    return normalizeFormValues(this.inputFields, values);
  }

  buildSubmissionValues(
    values: Record<string, any>,
    includeDocumentData: boolean = false,
  ): Record<string, any> {
    const normalizedValues = this.normalizeValues(values);
    if (!includeDocumentData) {
      return normalizedValues;
    }

    const entries = Object.entries(this.documentData);
    if (!entries.length) {
      return normalizedValues;
    }

    if (entries.length === 1) {
      const [fieldName, data] = entries[0];
      return {
        ...normalizedValues,
        document: {
          field: fieldName,
          ...data,
        },
      };
    }

    return {
      ...normalizedValues,
      document: {
        byField: Object.fromEntries(entries),
      },
    };
  }

  validateFileField(
    fieldName: string,
    value: any,
  ): { errorMessage: string; errorData?: any } | null {
    const fieldConfig = this.inputFields[fieldName];
    if (!fieldConfig || !isFileFieldType(fieldConfig.type)) {
      return null;
    }

    const files = getFileList(value);

    if (
      typeof fieldConfig.minFiles === "number" &&
      fieldConfig.minFiles > 0 &&
      files.length < fieldConfig.minFiles
    ) {
      return {
        errorMessage:
          fieldConfig.errorMsg ||
          `Not enough files: minimum ${fieldConfig.minFiles} required`,
        errorData: {
          type: "file-min-count",
          minFiles: fieldConfig.minFiles,
          fileCount: files.length,
        },
      };
    }

    if (!files.length) {
      return null;
    }

    if (
      typeof fieldConfig.maxFiles === "number" &&
      fieldConfig.maxFiles > 0 &&
      files.length > fieldConfig.maxFiles
    ) {
      return {
        errorMessage:
          fieldConfig.errorMsg ||
          `Too many files: maximum ${fieldConfig.maxFiles} allowed`,
        errorData: {
          type: "file-count",
          maxFiles: fieldConfig.maxFiles,
          fileCount: files.length,
        },
      };
    }

    const invalidFile = files.find((file) => !matchesAccept(file, fieldConfig.accept));
    if (invalidFile) {
      return {
        errorMessage:
          fieldConfig.fileTypeErrorMsg ||
          fieldConfig.errorMsg ||
          `File type not allowed: ${invalidFile.name}`,
        errorData: {
          type: "file-accept",
          fileName: invalidFile.name,
          accept: fieldConfig.accept,
        },
      };
    }

    if (typeof fieldConfig.maxFileSizeMb === "number" && fieldConfig.maxFileSizeMb > 0) {
      const maxBytes = fieldConfig.maxFileSizeMb * 1024 * 1024;
      const oversizedFile = files.find((file) => file.size > maxBytes);
      if (oversizedFile) {
        return {
          errorMessage:
            fieldConfig.fileSizeErrorMsg ||
            fieldConfig.errorMsg ||
            `File too large: ${oversizedFile.name} exceeds ${fieldConfig.maxFileSizeMb} MB`,
          errorData: {
            type: "file-size",
            fileName: oversizedFile.name,
            maxFileSizeMb: fieldConfig.maxFileSizeMb,
          },
        };
      }
    }

    if (
      typeof fieldConfig.maxTotalFileSizeMb === "number" &&
      fieldConfig.maxTotalFileSizeMb > 0
    ) {
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalBytes = fieldConfig.maxTotalFileSizeMb * 1024 * 1024;
      if (totalBytes > maxTotalBytes) {
        return {
          errorMessage:
            fieldConfig.errorMsg ||
            `Files too large together: total exceeds ${fieldConfig.maxTotalFileSizeMb} MB`,
          errorData: {
            type: "file-total-size",
            maxTotalFileSizeMb: fieldConfig.maxTotalFileSizeMb,
            totalBytes,
          },
        };
      }
    }

    return null;
  }

  validateValues(values: Record<string, any>): Record<string, any> {
    const formValues = this.normalizeValues(values);
    const validationErrors = this.validators.length
      ? validate(this.validators[0], formValues)
      : {};

    Object.values(this.inputFields).forEach((fieldConfig) => {
      if (!isFileFieldType(fieldConfig.type)) {
        return;
      }

      const fieldName = fieldConfig.name;
      const fileError = this.validateFileField(fieldName, formValues[fieldName]);
      if (fileError) {
        validationErrors[fieldName] = fileError;
      }
    });

    return validationErrors;
  }
}
