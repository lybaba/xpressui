import TFieldConfig from "./TFieldConfig";
import {
  TFormSubmitRequest,
  TFormUploadPolicyHook,
  TFormUploadPolicyResult,
  TFormUploadPolicyStage,
} from "./TFormConfig";
import { isFileLikeValue } from "./field";
import { buildFormDataBody, resolveSubmitRequestUrl, submitFormValues } from "./form-submit";

export type TFormUploadState = {
  phase: "upload";
  status: "uploading" | "complete" | "error";
  progress: number;
  fieldNames: string[];
};

type TXhrUploadResponse = {
  response: Response;
  result: any;
};

type TFormUploadRuntimeOptions = {
  emitEvent?: (eventName: string, detail: Record<string, any>) => boolean;
};

function noopEmitEvent(): boolean {
  return true;
}

function getFileFieldNames(
  values: Record<string, any>,
  fieldMap: Record<string, TFieldConfig>,
): string[] {
  return Object.entries(fieldMap)
    .filter(([fieldName, fieldConfig]) => {
      if (!values[fieldName]) {
        return false;
      }

      if (isFileLikeValue(values[fieldName])) {
        return true;
      }

      return Array.isArray(values[fieldName]) && values[fieldName].some((entry) => isFileLikeValue(entry));
    })
    .map(([fieldName]) => fieldName);
}

function createUploadState(
  fieldNames: string[],
  status: TFormUploadState["status"],
  progress: number,
): TFormUploadState {
  return {
    phase: "upload",
    status,
    progress,
    fieldNames,
  };
}

function parseXhrResult(xhr: XMLHttpRequest): any {
  const contentType = xhr.getResponseHeader("content-type") || "";
  if (contentType.includes("application/json")) {
    return xhr.responseText ? JSON.parse(xhr.responseText) : null;
  }

  return xhr.responseText || null;
}

function uploadWithProgress(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: FormData | Blob,
  onProgress: (progress: number) => void,
): Promise<TXhrUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || event.total === 0) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onerror = () => {
      reject(new Error("upload_network_error"));
    };
    xhr.onload = () => {
      const response = new Response(xhr.responseText, {
        status: xhr.status,
        headers: {
          "content-type": xhr.getResponseHeader("content-type") || "text/plain",
        },
      });
      const result = parseXhrResult(xhr);

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ response, result });
      } else {
        reject({ response, result });
      }
    };
    xhr.send(body);
  });
}

function buildPresignPayload(fieldName: string, file: File): Record<string, any> {
  return {
    fieldName,
    fileName: file.name,
    contentType: file.type,
    size: file.size,
  };
}

type TUploadRetryStage = "presign" | "upload";

type TUploadRetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitter: boolean;
};

type TUploadRetryFailureMeta = {
  stage: TUploadRetryStage;
  attempt: number;
  maxAttempts: number;
  retryable: boolean;
  status?: number;
  reason: string;
};

function sleep(ms: number): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeRetryPolicy(submitConfig: TFormSubmitRequest): TUploadRetryPolicy {
  return {
    maxAttempts: Math.max(1, Number(submitConfig.uploadRetryMaxAttempts ?? 3)),
    baseDelayMs: Math.max(0, Number(submitConfig.uploadRetryBaseDelayMs ?? 500)),
    maxDelayMs: Math.max(0, Number(submitConfig.uploadRetryMaxDelayMs ?? 5_000)),
    jitter: Boolean(submitConfig.uploadRetryJitter),
  };
}

function shouldRetryUploadError(error: any): boolean {
  const status = Number(error?.response?.status);
  if (Number.isFinite(status) && status > 0) {
    return status === 408 || status === 425 || status === 429 || status >= 500;
  }

  return true;
}

function getUploadErrorReason(error: any): string {
  return (
    error?.message
    || error?.result?.error
    || error?.result?.message
    || "upload_retry"
  );
}

function toUploadRetryFailureMeta(
  stage: TUploadRetryStage,
  attempt: number,
  maxAttempts: number,
  retryable: boolean,
  error: any,
): TUploadRetryFailureMeta {
  return {
    stage,
    attempt,
    maxAttempts,
    retryable,
    status: error?.response?.status,
    reason: getUploadErrorReason(error),
  };
}

function getRetryDelayMs(policy: TUploadRetryPolicy, attempt: number): number {
  const expFactor = Math.max(0, attempt - 1);
  const raw = policy.baseDelayMs * Math.pow(2, expFactor);
  const clamped = Math.min(raw, policy.maxDelayMs);
  if (!policy.jitter) {
    return clamped;
  }

  const jitter = Math.floor(Math.random() * Math.min(250, clamped + 1));
  return clamped + jitter;
}

function isUploadPolicyAllowed(result: TFormUploadPolicyResult): { allowed: boolean; reason?: string } {
  if (typeof result === "boolean") {
    return { allowed: result };
  }
  if (typeof result === "string") {
    return {
      allowed: false,
      reason: result,
    };
  }
  if (result && typeof result === "object") {
    const allowed = result.allowed !== false;
    return {
      allowed,
      reason: result.reason,
    };
  }

  return { allowed: true };
}

function getChunkSizeBytes(submitConfig: TFormSubmitRequest): number {
  const chunkSizeMb = Number(submitConfig.uploadChunkSizeMb || 0);
  if (!Number.isFinite(chunkSizeMb) || chunkSizeMb <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor(chunkSizeMb * 1024 * 1024));
}

function getUploadResumeStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function shouldUseUploadResume(submitConfig: TFormSubmitRequest): boolean {
  return submitConfig.uploadResumeEnabled !== false;
}

function getUploadResumeKey(
  submitConfig: TFormSubmitRequest,
  fieldName: string,
  file: File,
): string {
  const namespace = submitConfig.uploadResumeKey
    || submitConfig.presignEndpoint
    || submitConfig.endpoint
    || "default";
  return `xpressui:upload-resume:${namespace}:${fieldName}:${file.name}:${file.size}:${file.lastModified}`;
}

function loadUploadResumeChunkIndex(
  submitConfig: TFormSubmitRequest,
  fieldName: string,
  file: File,
): number {
  if (!shouldUseUploadResume(submitConfig)) {
    return 0;
  }
  const storage = getUploadResumeStorage();
  if (!storage) {
    return 0;
  }
  const raw = storage.getItem(getUploadResumeKey(submitConfig, fieldName, file));
  if (!raw) {
    return 0;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

function saveUploadResumeChunkIndex(
  submitConfig: TFormSubmitRequest,
  fieldName: string,
  file: File,
  chunkIndex: number,
): void {
  if (!shouldUseUploadResume(submitConfig)) {
    return;
  }
  const storage = getUploadResumeStorage();
  if (!storage) {
    return;
  }
  storage.setItem(
    getUploadResumeKey(submitConfig, fieldName, file),
    String(Math.max(0, chunkIndex)),
  );
}

function clearUploadResumeChunkIndex(
  submitConfig: TFormSubmitRequest,
  fieldName: string,
  file: File,
): void {
  if (!shouldUseUploadResume(submitConfig)) {
    return;
  }
  const storage = getUploadResumeStorage();
  if (!storage) {
    return;
  }
  storage.removeItem(getUploadResumeKey(submitConfig, fieldName, file));
}

export class FormUploadRuntime {
  emitEvent: NonNullable<TFormUploadRuntimeOptions["emitEvent"]>;

  constructor(options: TFormUploadRuntimeOptions = {}) {
    this.emitEvent = options.emitEvent || noopEmitEvent;
  }

  emitUploadEvent(
    eventName: string,
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
    state: TFormUploadState,
    extra?: Record<string, any>,
  ): void {
    this.emitEvent(eventName, {
      values,
      submit: submitConfig,
      result: {
        ...state,
        ...extra,
      },
    });
  }

  async submit(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
    fieldMap: Record<string, TFieldConfig>,
  ): Promise<{ response: Response; result: any }> {
    const fileFieldNames = getFileFieldNames(values, fieldMap);
    const hasFileValues = fileFieldNames.length > 0;
    await this.runUploadPolicies(values, submitConfig, fieldMap, fileFieldNames);

    if (!hasFileValues || submitConfig.mode !== "form-data") {
      return submitFormValues(values, submitConfig, fieldMap);
    }

    if (
      submitConfig.uploadStrategy === "presigned" &&
      submitConfig.presignEndpoint
    ) {
      return this.submitWithPresignedUploads(values, submitConfig, fieldMap, fileFieldNames);
    }

    return this.submitMultipart(values, submitConfig, fieldMap, fileFieldNames);
  }

  async runSingleUploadPolicy(
    stage: TFormUploadPolicyStage,
    hook: TFormUploadPolicyHook | undefined,
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
    fieldMap: Record<string, TFieldConfig>,
    fileFieldNames: string[],
  ): Promise<void> {
    if (!hook || !fileFieldNames.length) {
      return;
    }

    for (const fieldName of fileFieldNames) {
      const fieldValue = values[fieldName];
      const files = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
      const uploadFiles = files.filter((entry) => isFileLikeValue(entry)) as File[];
      for (const file of uploadFiles) {
        const result = await hook({
          stage,
          fieldName,
          file,
          values,
          submit: submitConfig,
          formConfig: null,
          field: fieldMap[fieldName],
        });
        const decision = isUploadPolicyAllowed(result);
        if (!decision.allowed) {
          const reason = decision.reason || `${stage} policy rejected file "${file.name}".`;
          this.emitEvent("form-ui:file-policy-rejected", {
            values,
            submit: submitConfig,
            result: {
              stage,
              fieldName,
              fileName: file.name,
              reason,
            },
          });
          throw new Error(reason);
        }
      }
    }
  }

  async runUploadPolicies(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
    fieldMap: Record<string, TFieldConfig>,
    fileFieldNames: string[],
  ): Promise<void> {
    if (!fileFieldNames.length) {
      return;
    }

    await this.runSingleUploadPolicy(
      "file-acceptance",
      submitConfig.fileAcceptancePolicy,
      values,
      submitConfig,
      fieldMap,
      fileFieldNames,
    );
    await this.runSingleUploadPolicy(
      "content-moderation",
      submitConfig.contentModerationPolicy,
      values,
      submitConfig,
      fieldMap,
      fileFieldNames,
    );
    await this.runSingleUploadPolicy(
      "virus-scan",
      submitConfig.virusScanPolicy,
      values,
      submitConfig,
      fieldMap,
      fileFieldNames,
    );
  }

  async submitMultipart(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
    fieldMap: Record<string, TFieldConfig>,
    fileFieldNames: string[],
  ): Promise<{ response: Response; result: any }> {
    const body = buildFormDataBody(values, submitConfig, fieldMap);
    const headers = { ...(submitConfig.headers || {}) };
    const method = submitConfig.method || "POST";
    const endpoint = resolveSubmitRequestUrl(
      submitConfig.endpoint,
      submitConfig.baseUrl,
    );

    this.emitUploadEvent(
      "form-ui:upload-start",
      values,
      submitConfig,
      createUploadState(fileFieldNames, "uploading", 0),
    );

    const result = await uploadWithProgress(
      endpoint,
      method,
      headers,
      body,
      (progress) => {
        this.emitUploadEvent(
          "form-ui:upload-progress",
          values,
          submitConfig,
          createUploadState(fileFieldNames, "uploading", progress),
        );
      },
    ).catch((error) => {
      this.emitUploadEvent(
        "form-ui:upload-error",
        values,
        submitConfig,
        createUploadState(fileFieldNames, "error", 0),
      );
      throw error;
    });

    this.emitUploadEvent(
      "form-ui:upload-complete",
      values,
      submitConfig,
      createUploadState(fileFieldNames, "complete", 100),
    );

    return result;
  }

  async submitWithPresignedUploads(
    values: Record<string, any>,
    submitConfig: TFormSubmitRequest,
    fieldMap: Record<string, TFieldConfig>,
    fileFieldNames: string[],
  ): Promise<{ response: Response; result: any }> {
    const transformedValues = { ...values };
    const allFiles = fileFieldNames.flatMap((fieldName) => {
      const fieldValue = values[fieldName];
      const files = Array.isArray(fieldValue) ? fieldValue : [fieldValue];
      return files
        .filter((entry) => isFileLikeValue(entry))
        .map((file) => ({ fieldName, file: file as File }));
    });

    let completed = 0;
    const total = Math.max(1, allFiles.length);
    const retryPolicy = normalizeRetryPolicy(submitConfig);

    this.emitUploadEvent(
      "form-ui:upload-start",
      values,
      submitConfig,
      createUploadState(fileFieldNames, "uploading", 0),
      { strategy: "presigned" },
    );

    for (const { fieldName, file } of allFiles) {
      const presignUrl = resolveSubmitRequestUrl(
        submitConfig.presignEndpoint as string,
        submitConfig.baseUrl,
      );

      const executeWithRetry = async <T>(
        stage: TUploadRetryStage,
        operation: () => Promise<T>,
      ): Promise<T> => {
        let lastError: any = null;
        let attemptsPerformed = 0;
        for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
          attemptsPerformed = attempt;
          try {
            return await operation();
          } catch (error: any) {
            lastError = error;
            const retryable = shouldRetryUploadError(error);
            if (!retryable || attempt >= retryPolicy.maxAttempts) {
              if (lastError && typeof lastError === "object") {
                (lastError as any).__uploadRetry = toUploadRetryFailureMeta(
                  stage,
                  attempt,
                  retryPolicy.maxAttempts,
                  retryable,
                  error,
                );
              }
              break;
            }
            const delayMs = getRetryDelayMs(retryPolicy, attempt);
            const nextRetryAt = Date.now() + delayMs;
            this.emitUploadEvent(
              "form-ui:upload-retry",
              values,
              submitConfig,
              createUploadState(fileFieldNames, "uploading", Math.round((completed / total) * 100)),
              {
                strategy: "presigned",
                stage,
                fieldName,
                fileName: file.name,
                attempt,
                maxAttempts: retryPolicy.maxAttempts,
                nextRetryAt,
                delayMs,
                reason: getUploadErrorReason(error),
                status: error?.response?.status,
              },
            );
            await sleep(delayMs);
          }
        }

        if (lastError && typeof lastError === "object" && !(lastError as any).__uploadRetry) {
          (lastError as any).__uploadRetry = toUploadRetryFailureMeta(
            stage,
            Math.max(1, attemptsPerformed),
            retryPolicy.maxAttempts,
            shouldRetryUploadError(lastError),
            lastError,
          );
        }

        throw lastError;
      };

      const presignResult = await executeWithRetry("presign", async () => {
        const presignResponse = await fetch(presignUrl, {
          method: submitConfig.presignMethod || "POST",
          headers: {
            "Content-Type": "application/json",
            ...(submitConfig.presignHeaders || {}),
          },
          body: JSON.stringify(buildPresignPayload(fieldName, file)),
        });
        const presignContentType = presignResponse.headers.get("content-type") || "";
        const result = presignContentType.includes("application/json")
          ? await presignResponse.json()
          : await presignResponse.text();
        if (!presignResponse.ok) {
          throw {
            response: presignResponse,
            result,
          };
        }

        return result;
      }).catch((error) => {
        const retryMeta = (error as any)?.__uploadRetry as TUploadRetryFailureMeta | undefined;
        this.emitUploadEvent(
          "form-ui:upload-error",
          values,
          submitConfig,
          createUploadState(fileFieldNames, "error", Math.round((completed / total) * 100)),
          {
            strategy: "presigned",
            stage: "presign",
            fieldName,
            fileName: file.name,
            attempt: retryMeta?.attempt,
            maxAttempts: retryMeta?.maxAttempts,
            retryable: retryMeta?.retryable,
            reason: retryMeta?.reason || getUploadErrorReason(error),
            status: retryMeta?.status ?? error?.response?.status,
          },
        );
        throw error;
      });
      const uploadUrl = presignResult[submitConfig.presignUploadUrlKey || "uploadUrl"];
      const fileUrl = presignResult[submitConfig.presignFileUrlKey || "fileUrl"];
      const chunkSizeBytes = getChunkSizeBytes(submitConfig);
      const uploadMethod = submitConfig.uploadMethod || "PUT";

      const uploadFileInChunks = async (): Promise<void> => {
        if (chunkSizeBytes <= 0 || file.size <= chunkSizeBytes) {
          await uploadWithProgress(
            uploadUrl,
            uploadMethod,
            {},
            file,
            (progress) => {
              const aggregateProgress = Math.round(((completed + progress / 100) / total) * 100);
              this.emitUploadEvent(
                "form-ui:upload-progress",
                values,
                submitConfig,
                createUploadState(fileFieldNames, "uploading", aggregateProgress),
                { strategy: "presigned", fieldName },
              );
            },
          );
          return;
        }

        const chunkMethod = submitConfig.uploadChunkMethod || uploadMethod;
        const totalChunks = Math.ceil(file.size / chunkSizeBytes);
        const storedResumeChunkIndex = Math.max(0, loadUploadResumeChunkIndex(submitConfig, fieldName, file));
        const resumeChunkIndex = storedResumeChunkIndex >= totalChunks
          ? 0
          : storedResumeChunkIndex;
        if (resumeChunkIndex > 0) {
          this.emitUploadEvent(
            "form-ui:upload-progress",
            values,
            submitConfig,
            createUploadState(fileFieldNames, "uploading", Math.round(((completed + resumeChunkIndex / totalChunks) / total) * 100)),
            {
              strategy: "presigned",
              fieldName,
              resumed: true,
              resumeChunkIndex,
              chunkCount: totalChunks,
            },
          );
        }
        for (let chunkIndex = resumeChunkIndex; chunkIndex < totalChunks; chunkIndex += 1) {
          const start = chunkIndex * chunkSizeBytes;
          const end = Math.min(file.size, start + chunkSizeBytes);
          const chunk = file.slice(start, end);
          await uploadWithProgress(
            uploadUrl,
            chunkMethod,
            {
              "Content-Type": file.type || "application/octet-stream",
              "Content-Range": `bytes ${start}-${end - 1}/${file.size}`,
            },
            chunk,
            (progress) => {
              const chunkProgress = (chunkIndex + progress / 100) / totalChunks;
              const aggregateProgress = Math.round(((completed + chunkProgress) / total) * 100);
              this.emitUploadEvent(
                "form-ui:upload-progress",
                values,
                submitConfig,
                createUploadState(fileFieldNames, "uploading", aggregateProgress),
                {
                  strategy: "presigned",
                  fieldName,
                  chunkIndex,
                  chunkCount: totalChunks,
                },
              );
            },
          );
          saveUploadResumeChunkIndex(submitConfig, fieldName, file, chunkIndex + 1);
        }
        clearUploadResumeChunkIndex(submitConfig, fieldName, file);
      };

      await executeWithRetry(
        "upload",
        uploadFileInChunks,
      ).catch((error) => {
        const retryMeta = (error as any)?.__uploadRetry as TUploadRetryFailureMeta | undefined;
        this.emitUploadEvent(
          "form-ui:upload-error",
          values,
          submitConfig,
          createUploadState(fileFieldNames, "error", Math.round((completed / total) * 100)),
          {
            strategy: "presigned",
            stage: "upload",
            fieldName,
            fileName: file.name,
            attempt: retryMeta?.attempt,
            maxAttempts: retryMeta?.maxAttempts,
            retryable: retryMeta?.retryable,
            reason: retryMeta?.reason || getUploadErrorReason(error),
            status: retryMeta?.status ?? error?.response?.status,
          },
        );
        throw error;
      });

      completed += 1;
      const currentValue = transformedValues[fieldName];
      if (Array.isArray(currentValue)) {
        const nextValues = (currentValue as any[]).map((entry) => (entry === file ? fileUrl : entry));
        transformedValues[fieldName] = nextValues;
      } else {
        transformedValues[fieldName] = fileUrl;
      }
    }

    this.emitUploadEvent(
      "form-ui:upload-complete",
      transformedValues,
      submitConfig,
      createUploadState(fileFieldNames, "complete", 100),
      { strategy: "presigned" },
    );

    return submitFormValues(transformedValues, submitConfig, fieldMap);
  }
}
