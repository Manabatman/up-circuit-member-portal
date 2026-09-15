import { apiJson } from "./client";

export type AcademicYear = {
  id: string;
  start_year: number;
  label: string;
  is_current: boolean;
  renewal_opens_at: string | null;
  renewal_closes_at: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchCurrentAcademicYear(): Promise<AcademicYear> {
  return apiJson<AcademicYear>("/api/v1/academic-years/current");
}
