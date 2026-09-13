const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const SESSION_KEY = "agritrust.sessionToken";

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  token?: string;
};

export function getSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY);
}

export function storeSessionToken(token: string): void {
  window.sessionStorage.setItem(SESSION_KEY, token);
}

export async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = options.token ?? getSessionToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const payload = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    data?: T;
  };

  if (!response.ok || payload.success === false) {
    throw new Error(payload.error ?? `Request failed with status ${response.status}`);
  }

  return (payload.data ?? payload) as T;
}
