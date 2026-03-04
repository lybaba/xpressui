import TFieldConfig from "./TFieldConfig";
import { TFormSubmitRequest } from "./TFormConfig";
import { isFileLikeValue } from "./field";
import { buildFormDataBody, submitFormValues } from "./form-submit";

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

    this.emitUploadEvent(
      "form-ui:upload-start",
      values,
      submitConfig,
      createUploadState(fileFieldNames, "uploading", 0),
    );

    const result = await uploadWithProgress(
      submitConfig.endpoint,
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

    this.emitUploadEvent(
      "form-ui:upload-start",
      values,
      submitConfig,
      createUploadState(fileFieldNames, "uploading", 0),
      { strategy: "presigned" },
    );

    for (const { fieldName, file } of allFiles) {
      const presignResponse = await fetch(submitConfig.presignEndpoint as string, {
        method: submitConfig.presignMethod || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(submitConfig.presignHeaders || {}),
        },
        body: JSON.stringify(buildPresignPayload(fieldName, file)),
      });
      const presignResult = await presignResponse.json();
      const uploadUrl = presignResult[submitConfig.presignUploadUrlKey || "uploadUrl"];
      const fileUrl = presignResult[submitConfig.presignFileUrlKey || "fileUrl"];

      await uploadWithProgress(
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
