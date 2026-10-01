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

export type LoginResult = { verification_required: boolean };

export async function login(email: string, password: string): Promise<LoginResult> {
  const response = await apiFetch("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw await readApiError(response);
  }
  return (await response.json()) as LoginResult;
}

export async function registerAccount(body: {
  email: string;
  password: string;
  full_name: string;
}): Promise<void> {
  const response = await apiFetch("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw await readApiError(response);
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
