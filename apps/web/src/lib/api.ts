const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export interface ApiOptions extends RequestInit {
  token?: string | null;
}

export async function apiFetch<T>(path: string, { token, headers, ...init }: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? response.statusText);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, options?: ApiOptions) => apiFetch<T>(path, { ...options, method: options?.method ?? 'GET' }),
  post: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),
  postForm: async <T>(path: string, formData: FormData, options?: ApiOptions) => {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      headers: {
        ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...(options?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.error ?? response.statusText);
    }
    return (await response.json()) as T;
  },
};
