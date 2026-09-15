import { apiJson } from "./client";

export type Division = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  is_standing_division: boolean;
};

export type DivisionList = {
  items: Division[];
  meta: { total: number };
};

export type DivisionUpdate = {
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
};

export async function fetchDivisions(includeInactive = false): Promise<DivisionList> {
  const params = new URLSearchParams();
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  const query = params.toString();
  return apiJson<DivisionList>(`/api/v1/divisions${query ? `?${query}` : ""}`);
}

export async function fetchDivision(id: string): Promise<Division> {
  return apiJson<Division>(`/api/v1/divisions/${id}`);
}

export async function updateDivision(id: string, body: DivisionUpdate): Promise<Division> {
  return apiJson<Division>(`/api/v1/divisions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
