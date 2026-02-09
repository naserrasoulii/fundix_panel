export type ApiError = {
  status: number;
  message: string;
  details?: unknown;
};

const DEFAULT_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function buildApiUrl(path: string) {
  if (!DEFAULT_API_BASE_URL) {
    return path;
  }

  return `${DEFAULT_API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init.headers
    },
    credentials: "include"
  });

  if (!response.ok) {
    let details: unknown;

    try {
      details = await response.json();
    } catch {
      details = await response.text();
    }

    const error: ApiError = {
      status: response.status,
      message: response.statusText || "Request failed",
      details
    };

    throw error;
  }

  return (await response.json()) as T;
}
