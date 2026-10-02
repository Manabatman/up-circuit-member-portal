import {
  COURSE_CATALOG,
  EXAM_ARCHIVES,
  SCHEDULED_COURSE_EXAMS,
  STUDY_NEXT_DAYS,
  type CourseCatalogEntry,
  type ExamArchiveEntry,
  type ScheduledCourseExam,
} from "../content/eeeExamSchedule";
import { formatTimeOfDay, localIsoDate } from "./eventDates";

export type { ScheduledCourseExam, CourseCatalogEntry, ExamArchiveEntry };

export function parseExamDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function formatExamDateShort(iso: string): string {
  return parseExamDate(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function examEndDate(exam: ScheduledCourseExam): string {
  return exam.endDate ?? exam.date;
}

export function isMultiDayExam(exam: ScheduledCourseExam): boolean {
  const end = examEndDate(exam);
  return end !== exam.date;
}

export function isSingleDayExam(exam: ScheduledCourseExam): boolean {
  return !isMultiDayExam(exam);
}

export function examDisplayLabel(exam: ScheduledCourseExam): string {
  return `${exam.courseCode} · ${exam.examName}`;
}

export function formatExamDateRange(exam: ScheduledCourseExam): string {
  if (!isMultiDayExam(exam)) {
    return formatExamDateShort(exam.date);
  }
  const start = parseExamDate(exam.date);
  const end = parseExamDate(examEndDate(exam));
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${start.toLocaleDateString(undefined, { month: "short" })} ${start.getDate()}–${end.getDate()}`;
  }
  return `${formatExamDateShort(exam.date)} – ${formatExamDateShort(examEndDate(exam))}`;
}

export function formatExamTimeRange(
  startTime?: string,
  endTime?: string,
): string {
  if (!startTime?.trim()) return "";
  const start = formatTimeOfDay(startTime.length === 5 ? `${startTime}:00` : startTime);
  const end = endTime?.trim()
    ? formatTimeOfDay(endTime.length === 5 ? `${endTime}:00` : endTime)
    : null;
  if (start && end) return `${start}–${end}`;
  return start ?? "";
}

export function formatExamAgendaMeta(exam: ScheduledCourseExam): string {
  const parts: string[] = [];
  if (isMultiDayExam(exam)) {
    parts.push(formatExamDateRange(exam));
  }
  const time = formatExamTimeRange(exam.startTime, exam.endTime);
  if (time) parts.push(time);
  return parts.join(" · ");
}

export function resolveExamUrl(exam: ScheduledCourseExam, fallbackUrl: string | null): string | null {
  return exam.url ?? fallbackUrl;
}

export function resolveArchiveUrl(entry: ExamArchiveEntry, fallbackUrl: string | null): string | null {
  return entry.url ?? fallbackUrl;
}

export function examStableKey(exam: ScheduledCourseExam): string {
  return `${exam.courseCode}|${exam.examName}|${exam.date}|${examEndDate(exam)}`;
}

export function allScheduledExams(): ScheduledCourseExam[] {
  return [...SCHEDULED_COURSE_EXAMS].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    const endCmp = examEndDate(a).localeCompare(examEndDate(b));
    if (endCmp !== 0) return endCmp;
    return a.courseCode.localeCompare(b.courseCode);
  });
}

export function multiDayExams(): ScheduledCourseExam[] {
  return allScheduledExams().filter(isMultiDayExam);
}

export function upcomingExams(fromDate = new Date(), withinDays = STUDY_NEXT_DAYS): ScheduledCourseExam[] {
  const startIso = localIsoDate(fromDate);
  const end = new Date(fromDate);
  end.setDate(end.getDate() + withinDays);
  const endIso = localIsoDate(end);
  return allScheduledExams().filter((e) => e.date >= startIso && e.date <= endIso);
}

export function examsInMonth(year: number, month: number): ScheduledCourseExam[] {
  const monthStart = localIsoDate(new Date(year, month, 1));
  const monthEnd = localIsoDate(new Date(year, month + 1, 0));
  return allScheduledExams().filter(
    (e) => e.date <= monthEnd && examEndDate(e) >= monthStart,
  );
}

/** Single-day exams only (multi-day render as week bars) */
export function singleDayExamsOnDate(iso: string): ScheduledCourseExam[] {
  return allScheduledExams().filter((e) => isSingleDayExam(e) && e.date === iso);
}

/** @deprecated use singleDayExamsOnDate */
export function examsOnDate(iso: string): ScheduledCourseExam[] {
  return singleDayExamsOnDate(iso);
}

export function examOverlapsRange(
  exam: ScheduledCourseExam,
  range: { start: string; end: string },
): boolean {
  return exam.date <= range.end && examEndDate(exam) >= range.start;
}

export function courseCatalog(): CourseCatalogEntry[] {
  return [...COURSE_CATALOG];
}

export function examArchives(): ExamArchiveEntry[] {
  return [...EXAM_ARCHIVES];
}

export function uniqueCourseCodesFromExams(): string[] {
  const set = new Set(SCHEDULED_COURSE_EXAMS.map((e) => e.courseCode));
  return [...set].sort();
}

export function examAgendaSortKey(exam: ScheduledCourseExam): string {
  const time = (exam.startTime ?? "00:00").padStart(5, "0");
  return `${exam.date}T${time}`;
}

export type MergedAgendaItem =
  | { kind: "event"; sortKey: string; event: import("../api/events").PortalEvent }
  | { kind: "exam"; sortKey: string; exam: ScheduledCourseExam };

export function mergeUpcomingAgenda(
  events: import("../api/events").PortalEvent[],
  fromDate = new Date(),
  limit = 8,
): MergedAgendaItem[] {
  const today = localIsoDate(fromDate);
  const eventItems: MergedAgendaItem[] = events
    .filter((e) => {
      const end = e.ends_on ?? e.starts_on;
      return end >= today;
    })
    .map((event) => ({
      kind: "event" as const,
      sortKey: `${event.starts_on}T${(event.start_time ?? "00:00").slice(0, 5)}`,
      event,
    }));

  const examItems: MergedAgendaItem[] = allScheduledExams()
    .filter((exam) => examEndDate(exam) >= today)
    .map((exam) => ({
      kind: "exam" as const,
      sortKey: examAgendaSortKey(exam),
      exam,
    }));

  return [...eventItems, ...examItems]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .slice(0, limit);
}
