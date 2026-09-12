"use client";

/** Client helper for the admin API: adds the CSRF header and unwraps errors. */

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)mud_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : "";
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("content-type", "application/json");
  if (init.method && init.method !== "GET") headers.set("x-csrf-token", csrfToken());

  const response = await fetch(url, { ...init, headers, cache: "no-store" });

  let payload: { ok?: boolean; data?: T; error?: string; fieldErrors?: Record<string, string> } = {};
  try {
    payload = await response.json();
  } catch {
    throw new ApiError("The server returned an unexpected response.", response.status);
  }

  if (!response.ok || !payload.ok) {
    throw new ApiError(payload.error ?? "Something went wrong.", response.status, payload.fieldErrors);
  }
  return payload.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: "POST", body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(url: string, body: unknown) => request<T>(url, { method: "PUT", body: JSON.stringify(body) }),
  del: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};

export type ListResponse<T> = { items: T[]; total: number; page: number; perPage: number; pages: number };
