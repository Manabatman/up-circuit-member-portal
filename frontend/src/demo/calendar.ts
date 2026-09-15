/**
 * Demo calendar content for the member portal UI.
 * Not an official Circuit schedule.
 */

export type CalendarEventCategory = "academic" | "org" | "project";

export type CalendarEventKind = "month" | "range" | "day";

export type DemoCalendarEvent = {
  id: string;
  title: string;
  category: CalendarEventCategory;
  kind: CalendarEventKind;
  /** For kind=month: 1-12 */
  month?: number;
  /** For kind=month and range: calendar year */
  year?: number;
  /** For kind=day or range start */
  date?: string;
  /** For kind=range end (ISO YYYY-MM-DD) */
  endDate?: string;
};

export const DEMO_CALENDAR_EVENTS: DemoCalendarEvent[] = [
  {
    id: "general-assembly-2026-09",
    title: "General Assembly",
    category: "org",
    kind: "month",
    year: 2026,
    month: 9,
  },
  {
    id: "apprenticeship-season-2026-10",
    title: "Apprenticeship Season",
    category: "org",
    kind: "range",
    year: 2026,
    month: 10,
    date: "2026-10-01",
    endDate: "2026-10-31",
  },
  {
    id: "squeeeze-hs-2026-11",
    title: "SquEEEze 29 High School Competition",
    category: "project",
    kind: "month",
    year: 2026,
    month: 11,
  },
  {
    id: "squeeeze-college-2026-11",
    title: "SquEEEze 29 College Competition",
    category: "project",
    kind: "month",
    year: 2026,
    month: 11,
  },
  {
    id: "final-interview-2026-12",
    title: "Final Interview",
    category: "org",
    kind: "month",
    year: 2026,
    month: 12,
  },
  {
    id: "talents-night-2026-12",
    title: "Talent's Night",
    category: "org",
    kind: "month",
    year: 2026,
    month: 12,
  },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function periodStartIso(event: DemoCalendarEvent): string {
  if (event.kind === "range" && event.date) return event.date;
  if (event.kind === "day" && event.date) return event.date;
  if (event.kind === "month" && event.year && event.month) {
    return `${event.year}-${String(event.month).padStart(2, "0")}-01`;
  }
  return "9999-12-31";
}

export function formatEventPeriod(event: DemoCalendarEvent): string {
  if (event.kind === "range" && event.date && event.endDate) {
    const start = new Date(event.date + "T12:00:00");
    const end = new Date(event.endDate + "T12:00:00");
    const sameMonth =
      start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${MONTH_NAMES[start.getMonth()]} ${start.getDate()} to ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} to ${end.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}`;
  }
  if (event.kind === "month" && event.year && event.month) {
    return `${MONTH_NAMES[event.month - 1]} ${event.year}`;
  }
  if (event.kind === "day" && event.date) {
    const d = new Date(event.date + "T12:00:00");
    return d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
  }
  return "";
}

export function getDemoEvent(id: string): DemoCalendarEvent | undefined {
  return DEMO_CALENDAR_EVENTS.find((e) => e.id === id);
}

export function getUpcomingDemoEvents(limit = 3, fromDate = new Date()): DemoCalendarEvent[] {
  const todayIso = fromDate.toISOString().slice(0, 10);
  return [...DEMO_CALENDAR_EVENTS]
    .filter((e) => periodStartIso(e) >= todayIso || eventSpansDate(e, todayIso))
    .sort((a, b) => periodStartIso(a).localeCompare(periodStartIso(b)))
    .slice(0, limit);
}

export function getEventsForMonth(year: number, month: number): DemoCalendarEvent[] {
  const monthIndex = month + 1;
  return DEMO_CALENDAR_EVENTS.filter((e) => eventInMonth(e, year, monthIndex)).sort((a, b) =>
    periodStartIso(a).localeCompare(periodStartIso(b)),
  );
}

export function eventInMonth(event: DemoCalendarEvent, year: number, month: number): boolean {
  if (event.kind === "month") {
    return event.year === year && event.month === month;
  }
  if (event.kind === "range" && event.date && event.endDate) {
    const start = new Date(event.date + "T12:00:00");
    const end = new Date(event.endDate + "T12:00:00");
    const viewStart = new Date(year, month - 1, 1);
    const viewEnd = new Date(year, month, 0);
    return start <= viewEnd && end >= viewStart;
  }
  if (event.kind === "day" && event.date) {
    const d = new Date(event.date + "T12:00:00");
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  }
  return false;
}

export function eventSpansDate(event: DemoCalendarEvent, isoDate: string): boolean {
  if (event.kind === "day" && event.date) {
    return event.date === isoDate;
  }
  if (event.kind === "range" && event.date && event.endDate) {
    return isoDate >= event.date && isoDate <= event.endDate;
  }
  if (event.kind === "month" && event.year && event.month) {
    const prefix = `${event.year}-${String(event.month).padStart(2, "0")}`;
    return isoDate.startsWith(prefix);
  }
  return false;
}

/** All demo events that apply to a calendar day (day, range, or whole-month). */
export function getEventsForDate(isoDate: string): DemoCalendarEvent[] {
  return DEMO_CALENDAR_EVENTS.filter((e) => eventSpansDate(e, isoDate)).sort((a, b) =>
    periodStartIso(a).localeCompare(periodStartIso(b)),
  );
}

export function getRangeEventsForMonth(year: number, month: number): DemoCalendarEvent[] {
  return DEMO_CALENDAR_EVENTS.filter(
    (e) => e.kind === "range" && eventInMonth(e, year, month),
  );
}

export function getMonthLevelEventsForMonth(year: number, month: number): DemoCalendarEvent[] {
  return DEMO_CALENDAR_EVENTS.filter(
    (e) => e.kind === "month" && e.year === year && e.month === month + 1,
  );
}

export function getDayEventsForDate(isoDate: string): DemoCalendarEvent[] {
  return DEMO_CALENDAR_EVENTS.filter((e) => e.kind === "day" && e.date === isoDate);
}

export function categoryLabel(category: CalendarEventCategory): string {
  if (category === "academic") return "Academic";
  if (category === "org") return "Organizational";
  return "Project";
}

export function categoryAccentClass(category: CalendarEventCategory): string {
  if (category === "academic") return "calendarAccent_academic";
  if (category === "org") return "calendarAccent_org";
  return "calendarAccent_project";
}
