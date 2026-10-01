import { apiJson } from "./client";

export type ResourceCategory = {
  id: string;
  scope: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export type Resource = {
  id: string;
  category_id: string;
  division_id: string | null;
  title: string;
  description: string | null;
  url: string;
  resource_type: string;
  display_order: number;
  is_active: boolean;
  is_featured?: boolean;
  category: ResourceCategory;
};

export type ResourceList = {
  items: Resource[];
  meta: { total: number; offset: number; limit: number };
};

export type ResourceCategoryList = {
  items: ResourceCategory[];
  meta: { total: number; offset: number; limit: number };
};

export type ResourceInput = {
  category_id: string;
  division_id?: string | null;
  title: string;
  description?: string | null;
  url: string;
  resource_type: string;
  display_order?: number;
  is_featured?: boolean;
};

export type ResourceCategoryInput = {
  scope: "ACADEMIC" | "ORGANIZATIONAL";
  name: string;
  description?: string | null;
  display_order?: number;
};

export type ResourceCategoryUpdate = {
  name?: string;
  description?: string | null;
  display_order?: number;
  is_active?: boolean;
};

export async function fetchResources(
  scope: "academic" | "organizational",
  includeInactive = false,
  divisionId?: string | null,
): Promise<ResourceList> {
  const params = new URLSearchParams({ scope });
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  if (divisionId) {
    params.set("division_id", divisionId);
  }
  return apiJson<ResourceList>(`/api/v1/resources?${params.toString()}`);
}

export async function fetchResourceCategories(
  scope: "academic" | "organizational",
  includeInactive = false,
): Promise<ResourceCategoryList> {
  const params = new URLSearchParams({ scope });
  if (includeInactive) {
    params.set("include_inactive", "true");
  }
  return apiJson<ResourceCategoryList>(`/api/v1/resource-categories?${params.toString()}`);
}

export async function createResource(body: ResourceInput): Promise<Resource> {
  return apiJson<Resource>("/api/v1/resources", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateResource(
  id: string,
  body: Partial<ResourceInput> & { is_active?: boolean },
): Promise<Resource> {
  return apiJson<Resource>(`/api/v1/resources/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deactivateResource(id: string): Promise<void> {
  await apiJson<void>(`/api/v1/resources/${id}`, { method: "DELETE" });
}

export async function createResourceCategory(
  body: ResourceCategoryInput,
): Promise<ResourceCategory> {
  return apiJson<ResourceCategory>("/api/v1/resource-categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateResourceCategory(
  id: string,
  body: ResourceCategoryUpdate,
): Promise<ResourceCategory> {
  return apiJson<ResourceCategory>(`/api/v1/resource-categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
