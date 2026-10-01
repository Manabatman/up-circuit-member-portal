import { apiJson } from "./client";

export type AdminOverview = {
  total_members: number;
  pending_members: number;
  renewed_members: number;
  not_renewed_members: number;
  recent_registrations: {
    user_id: string;
    full_name: string;
    email: string;
    membership_status: string;
    registered_at: string;
  }[];
  recent_audit: {
    id: string;
    action: string;
    entity_type: string;
    created_at: string;
    actor_email: string | null;
  }[];
};

export async function fetchAdminOverview(): Promise<AdminOverview> {
  return apiJson<AdminOverview>("/api/v1/admin/overview");
}
