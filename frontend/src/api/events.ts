import { apiJson, apiFetch, readApiError } from "./client";

export type PortalEvent = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  starts_on: string;
  ends_on: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  is_flagship: boolean;
  image_url: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type EventListResponse = {
  items: PortalEvent[];
  meta: { total: number; offset: number; limit: number };
};

export async function fetchEvents(params?: {
  flagship?: boolean;
  from_date?: string;
  to_date?: string;
}): Promise<EventListResponse> {
  const search = new URLSearchParams();
  if (params?.flagship !== undefined) search.set("flagship", String(params.flagship));
  if (params?.from_date) search.set("from_date", params.from_date);
  if (params?.to_date) search.set("to_date", params.to_date);
  const qs = search.toString();
  return apiJson<EventListResponse>(`/api/v1/events${qs ? `?${qs}` : ""}`);
}

export async function fetchEvent(eventId: string): Promise<PortalEvent> {
  return apiJson<PortalEvent>(`/api/v1/events/${eventId}`);
}

export async function createEvent(body: Record<string, unknown>): Promise<PortalEvent> {
  const response = await apiFetch("/api/v1/events", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await readApiError(response);
  return (await response.json()) as PortalEvent;
}

export async function updateEvent(
  eventId: string,
  body: Record<string, unknown>,
): Promise<PortalEvent> {
  return apiJson<PortalEvent>(`/api/v1/events/${eventId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteEvent(eventId: string): Promise<void> {
  const response = await apiFetch(`/api/v1/events/${eventId}`, { method: "DELETE" });
  if (!response.ok && response.status !== 204) throw await readApiError(response);
}
