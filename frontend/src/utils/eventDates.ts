import type { PortalEvent } from "../api/events";

export function eventEndDate(event: PortalEvent): string {
  return event.ends_on ?? event.starts_on;
}

export function isMultiDayEvent(event: PortalEvent): boolean {
  return Boolean(event.ends_on && event.ends_on !== event.starts_on);
}

export function formatEventPeriod(event: PortalEvent): string {
  const start = new Date(`${event.starts_on}T12:00:00`);
  const endIso = eventEndDate(event);
  const end = new Date(`${endIso}T12:00:00`);
  if (event.starts_on === endIso) {
    return start.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: "long" })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

export function eventSpansDate(event: PortalEvent, isoDate: string): boolean {
  const end = eventEndDate(event);
  return isoDate >= event.starts_on && isoDate <= end;
}

export function isSingleDayEvent(event: PortalEvent): boolean {
  return !isMultiDayEvent(event);
}

export function mapEventCategoryForCard(
  category: string,
): "academic" | "org" | "project" {
  if (category === "ACADEMIC") return "academic";
  if (category === "ORGANIZATION" || category === "MEMBERSHIP") return "org";
  return "project";
}

export function categoryBarClass(category: string): string {
  const key = category.toLowerCase();
  if (key === "academic") return "calendarEventDot_academic";
  if (key === "organization") return "calendarEventDot_org";
  if (key === "membership") return "calendarEventDot_membership";
  return "calendarEventDot_project";
}
