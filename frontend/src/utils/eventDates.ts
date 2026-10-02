import type { PortalEvent } from "../api/events";

/** Calendar date in the local timezone (avoids UTC shifting the day). */
export function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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

/** Parse API time (HH:MM:SS or HH:MM) for display. */
export function formatTimeOfDay(timeStr: string | null | undefined): string | null {
  if (!timeStr) return null;
  const parts = timeStr.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1] ?? 0);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatWeekdayLong(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

export function formatEventRowMeta(event: PortalEvent): string {
  const segments: string[] = [];
  const weekday = formatWeekdayLong(event.starts_on);
  segments.push(weekday);
  const timeLabel = formatTimeOfDay(event.start_time);
  if (timeLabel) segments.push(timeLabel);
  if (event.location?.trim()) segments.push(event.location.trim());
  return segments.join(" · ");
}

export function startOfWeekIso(reference: Date): string {
  const d = new Date(reference);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(12, 0, 0, 0);
  return localIsoDate(d);
}

export function endOfWeekIso(reference: Date): string {
  const d = new Date(reference);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  d.setHours(12, 0, 0, 0);
  return localIsoDate(d);
}

export function formatDashboardDateEyebrow(date: Date): string {
  return date
    .toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })
    .toUpperCase();
}

export function eventOccursInMonth(event: PortalEvent, year: number, month: number): boolean {
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const startIso = localIsoDate(monthStart);
  const endIso = localIsoDate(monthEnd);
  const eventEnd = eventEndDate(event);
  return event.starts_on <= endIso && eventEnd >= startIso;
}

export function upcomingEventsFromToday(events: PortalEvent[], limit = 8): PortalEvent[] {
  const today = localIsoDate(new Date());
  return [...events]
    .filter((e) => eventEndDate(e) >= today)
    .sort((a, b) => {
      const cmp = a.starts_on.localeCompare(b.starts_on);
      if (cmp !== 0) return cmp;
      return (a.start_time ?? "").localeCompare(b.start_time ?? "");
    })
    .slice(0, limit);
}
