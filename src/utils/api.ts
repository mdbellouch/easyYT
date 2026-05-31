// Centralized API Client to inject custom user AI keys when configured
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const provider = localStorage.getItem("yt_llm_provider");
  const apiKey = localStorage.getItem("yt_llm_key");
  const model = localStorage.getItem("yt_llm_model");
  const baseUrl = localStorage.getItem("yt_llm_base_url");

  const nextInit = { ...(init || {}) };
  const headers = new Headers(nextInit.headers || {});
  headers.set("x-demo-mode", "false");

  if (provider && apiKey) {
    headers.set("x-provider", provider);
    headers.set("x-api-key", apiKey);
    if (model) headers.set("x-model", model);
    if (baseUrl) headers.set("x-base-url", baseUrl);
  }
  
  nextInit.headers = headers;
  return fetch(input, nextInit);
}
