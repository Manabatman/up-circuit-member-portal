// Shared API client — credentialed fetch to the FastAPI origin.

const API_BASE = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE) {
  throw new Error(
    "VITE_API_BASE_URL is missing. Copy frontend/.env.example to frontend/.env and restart npm run dev.",
  );
}

export type ApiError = {
  error: {
    code: string;
    message: string;
    details: Record<string, unknown>;
  };
};

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    code: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ApiNetworkError extends Error {
  constructor(message = "Unable to reach the server.") {
    super(message);
    this.name = "ApiNetworkError";
  }
}

export function describeApiError(err: unknown): string {
  if (err instanceof ApiNetworkError) {
    return "Unable to reach the server. Please check your connection and try again.";
  }
  if (err instanceof ApiRequestError) {
    if (err.status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (err.status === 403) {
      return "You don't have permission to perform this action.";
    }
    if (err.status === 500 || err.status === 503) {
      return "Server error. Please try again later.";
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Something went wrong. Please try again.";
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });
  } catch (err) {
    if (err instanceof TypeError) {
      throw new ApiNetworkError();
    }
    throw err;
  }
}

export async function readApiError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as ApiError;
    return new ApiRequestError(
      body.error?.message ?? "Request failed.",
      response.status,
      body.error?.code ?? "INTERNAL_ERROR",
      body.error?.details ?? {},
    );
  } catch {
    return new ApiRequestError("Request failed.", response.status, "INTERNAL_ERROR");
  }
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, init);
  if (!response.ok) {
    throw await readApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
