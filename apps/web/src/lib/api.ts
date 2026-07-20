export const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001";

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (method !== "GET") {
    headers.set("X-Requested-With", "XMLHttpRequest");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    method,
    headers,
    credentials: "include",
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : undefined;

  if (!response.ok) {
    const message = data && (data.detail || data.error);
    const error = new Error(typeof message === "string" ? message : response.statusText) as Error & {
      status?: number;
    };
    error.status = response.status;
    throw error;
  }

  return data as T;
}
