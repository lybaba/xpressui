import { TFormSubmitRequest } from "./TFormConfig";
import { isFileLikeValue } from "./field";
import { buildProviderPayload } from "./provider-registry";

function appendFormDataValue(
  formData: FormData,
  key: string,
  value: any,
  arrayMode: "brackets" | "repeat",
): void {
  if (value === undefined) {
    return;
  }

  if (isFileLikeValue(value)) {
    formData.append(key, value as File | Blob);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => {
      appendFormDataValue(
        formData,
        arrayMode === "brackets" ? `${key}[]` : key,
        entry,
        arrayMode,
      );
    });
    return;
  }

  if (value && typeof value === "object") {
    Object.entries(value).forEach(([childKey, childValue]) => {
      appendFormDataValue(formData, `${key}[${childKey}]`, childValue, arrayMode);
    });
    return;
  }

  formData.append(key, value === null ? "" : String(value));
}

export async function submitFormValues(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
): Promise<{ response: Response; result: any }> {
  const method = submitConfig.method || "POST";
  const mode = submitConfig.mode || "json";
  const formDataArrayMode = submitConfig.formDataArrayMode || "brackets";
  const headers = { ...(submitConfig.headers || {}) };
  let url = submitConfig.endpoint;
  const init: RequestInit = { method, headers };
  const payload = buildProviderPayload(values, submitConfig);

  if (method === "GET") {
    const searchParams = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      searchParams.set(key, String(value));
    });
    const query = searchParams.toString();
    if (query) {
      url += (url.includes("?") ? "&" : "?") + query;
    }
  } else if (mode === "form-data") {
    const body = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      appendFormDataValue(body, key, value, formDataArrayMode);
    });
    init.body = body;
  } else {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
    init.body = JSON.stringify(payload);
  }

  const response = await fetch(url, init);
  const contentType = response.headers.get("content-type") || "";
  let result: any = null;

  if (contentType.includes("application/json")) {
    result = await response.json();
  } else if (contentType.startsWith("text/")) {
    result = await response.text();
  }

  if (!response.ok) {
    throw { response, result };
  }

  return { response, result };
}
