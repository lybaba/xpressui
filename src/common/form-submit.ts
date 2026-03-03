import { TFormSubmitRequest } from "./TFormConfig";
import { buildProviderPayload } from "./provider-registry";

export async function submitFormValues(
  values: Record<string, any>,
  submitConfig: TFormSubmitRequest,
): Promise<{ response: Response; result: any }> {
  const method = submitConfig.method || "POST";
  const mode = submitConfig.mode || "json";
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
      body.append(key, String(value));
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
