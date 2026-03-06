import TFieldConfig from "./TFieldConfig";
import { TFormSubmitRequest } from "./TFormConfig";
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
  body: FormData | File,
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
        for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt += 1) {
          try {
            return await operation();
          } catch (error: any) {
            lastError = error;
            const retryable = shouldRetryUploadError(error);
            if (!retryable || attempt >= retryPolicy.maxAttempts) {
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
                attempt,
                maxAttempts: retryPolicy.maxAttempts,
                nextRetryAt,
                delayMs,
                reason:
                  error?.message
                  || error?.result?.error
                  || error?.result?.message
                  || "upload_retry",
                status: error?.response?.status,
              },
            );
            await sleep(delayMs);
          }
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
      });
      const uploadUrl = presignResult[submitConfig.presignUploadUrlKey || "uploadUrl"];
      const fileUrl = presignResult[submitConfig.presignFileUrlKey || "fileUrl"];

      await executeWithRetry(
        "upload",
        () => uploadWithProgress(
          uploadUrl,
          submitConfig.uploadMethod || "PUT",
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
        ),
      ).catch((error) => {
        this.emitUploadEvent(
          "form-ui:upload-error",
          values,
          submitConfig,
          createUploadState(fileFieldNames, "error", Math.round((completed / total) * 100)),
          { strategy: "presigned", fieldName },
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
