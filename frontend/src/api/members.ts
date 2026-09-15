import { apiJson } from "./client";

export type MemberDirectory = {
  user_id: string;
  full_name: string;
  degree_program: string | null;
  year_level: string | null;
  batch: string | null;
  membership_status: string;
  primary_division_id?: string | null;
  primary_division_name?: string | null;
};

export type MemberAdmin = MemberDirectory & {
  email: string;
  student_number: string | null;
  contact_number: string | null;
};

export type MemberSelf = {
  user_id: string;
  email: string;
  full_name: string;
  student_number: string | null;
  degree_program: string | null;
  year_level: string | null;
  contact_number: string | null;
  batch: string | null;
  membership_status: string;
};

export type MembershipSelf = {
  academic_year_label: string;
  membership_status: string;
  renewed_at: string | null;
  needs_renewal: boolean;
};

export type MemberList = {
  items: (MemberDirectory | MemberAdmin)[];
  meta: { total: number; offset: number; limit: number };
};

export async function fetchMembers(
  q?: string,
  membershipStatus?: string,
  divisionId?: string,
): Promise<MemberList> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (membershipStatus) params.set("membership_status", membershipStatus);
  if (divisionId) params.set("division_id", divisionId);
  const query = params.toString();
  return apiJson<MemberList>(`/api/v1/members${query ? `?${query}` : ""}`);
}

export async function fetchOwnProfile(): Promise<MemberSelf> {
  return apiJson<MemberSelf>("/api/v1/members/me");
}

export async function fetchOwnMembership(): Promise<MembershipSelf> {
  return apiJson<MembershipSelf>("/api/v1/membership/me");
}

export async function updateMembershipStatus(
  memberId: string,
  body: {
    status: string;
    academic_year: string;
    reason: string;
    confirm_full_name: string;
  },
) {
  return apiJson(`/api/v1/membership/${memberId}/status`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
