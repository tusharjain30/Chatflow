import { getAuthHeader } from "@/utils/authStorage";

export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader("user"),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : { status: response.ok ? 1 : 0 };

  if (!response.ok || json.status !== 1) {
    throw new Error(json.message || `Request failed (${response.status})`);
  }

  return json as T;
}
