import { apiJson, ApiRequestError, apiFetch, readApiError } from "./client";

export type MeResponse = {
  user_id: string;
  email: string;
  full_name: string;
  membership_status: string;
  roles: string[];
  permissions: string[];
  route_keys: string[];
};

export async function login(email: string, password: string): Promise<void> {
  const response = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw await readApiError(response);
  }
  const body = (await response.json()) as { verification_required?: boolean };
  if (!body.verification_required) {
    throw new Error("Login did not require verification.");
  }
}

export async function verifyCode(email: string, code: string): Promise<void> {
  const response = await apiFetch("/api/v1/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
  if (!response.ok) {
    throw await readApiError(response);
  }
}

export async function fetchMe(): Promise<MeResponse> {
  return apiJson<MeResponse>("/api/v1/auth/me");
}

export async function logout(): Promise<void> {
  const response = await apiFetch("/api/v1/auth/logout", { method: "POST" });
  if (!response.ok && response.status !== 204) {
    throw await readApiError(response);
  }
}

export { ApiRequestError };
