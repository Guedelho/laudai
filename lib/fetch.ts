class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new ApiError(data.error || "Erro inesperado.");
  return data as T;
}

export async function fetchOk(url: string, init?: RequestInit): Promise<void> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let message = "Erro inesperado.";
    try {
      const data = await res.json();
      if (data.error) message = data.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(message);
  }
}

export function jsonBody(body: unknown): RequestInit {
  return {
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function formBody(data: FormData): RequestInit {
  return { body: data };
}
