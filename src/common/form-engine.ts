import TFieldConfig from "./TFieldConfig";
import TFormConfig from "./TFormConfig";
import validate, { getValidators, TValidator } from "./Validator";
import { isFileFieldType, isFileLikeValue, normalizeFormValues } from "./field";

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

  constructor() {
    this.formConfig = null;
    this.validators = [];
    this.inputFields = {};
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

  normalizeValues(values: Record<string, any>): Record<string, any> {
    return normalizeFormValues(this.inputFields, values);
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
      const files = getFileList(formValues[fieldName]);

      if (
        typeof fieldConfig.minFiles === "number" &&
        fieldConfig.minFiles > 0 &&
        files.length < fieldConfig.minFiles
      ) {
        validationErrors[fieldName] = {
          errorMessage:
            fieldConfig.errorMsg ||
            `Not enough files: minimum ${fieldConfig.minFiles} required`,
          errorData: {
            type: "file-min-count",
            minFiles: fieldConfig.minFiles,
            fileCount: files.length,
          },
        };
        return;
      }

      if (!files.length) {
        return;
      }

      if (
        typeof fieldConfig.maxFiles === "number" &&
        fieldConfig.maxFiles > 0 &&
        files.length > fieldConfig.maxFiles
      ) {
        validationErrors[fieldName] = {
          errorMessage:
            fieldConfig.errorMsg ||
            `Too many files: maximum ${fieldConfig.maxFiles} allowed`,
          errorData: {
            type: "file-count",
            maxFiles: fieldConfig.maxFiles,
            fileCount: files.length,
          },
        };
        return;
      }

      const invalidFile = files.find((file) => !matchesAccept(file, fieldConfig.accept));
      if (invalidFile) {
        validationErrors[fieldName] = {
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
        return;
      }

      if (typeof fieldConfig.maxFileSizeMb === "number" && fieldConfig.maxFileSizeMb > 0) {
        const maxBytes = fieldConfig.maxFileSizeMb * 1024 * 1024;
        const oversizedFile = files.find((file) => file.size > maxBytes);
        if (oversizedFile) {
          validationErrors[fieldName] = {
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
    });

    return validationErrors;
  }
}
