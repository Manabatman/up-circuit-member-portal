import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { fetchEvents, type PortalEvent } from "../api/events";
import { fetchResources } from "../api/resources";
import { Icon } from "../components/Icon";
import {
  Button,
  EmptyState,
  ErrorState,
  EventCategoryTag,
  EventDateBlock,
  Eyebrow,
  OutlinedExternalButton,
  PageHeader,
  PageShell,
  PortalCard,
  Spinner,
} from "../components/ui";
import { resolvePortalLinks } from "../utils/portalLinks";
import { resolveEventCategoryDisplay } from "../utils/eventCategory";
import {
  eventEndDate,
  eventOccursInMonth,
  formatTimeOfDay,
  localIsoDate,
  isMultiDayEvent,
  isSingleDayEvent,
} from "../utils/eventDates";
import {
  allScheduledExams,
  examDisplayLabel,
  examEndDate,
  examOverlapsRange,
  examStableKey,
  formatExamAgendaMeta,
  formatExamDateRange,
  formatExamTimeRange,
  mergeUpcomingAgenda,
  multiDayExams,
  resolveExamUrl,
  singleDayExamsOnDate,
} from "../utils/examSchedule";
import styles from "../components/ui.module.css";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type DayCell = { date: Date; iso: string };

function buildWeeks(year: number, month: number): (DayCell | null)[][] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ date, iso: localIsoDate(date) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}

function weekRangeIso(week: (DayCell | null)[]): { start: string; end: string } | null {
  const days = week.filter(Boolean) as DayCell[];
  if (days.length === 0) return null;
  return { start: days[0].iso, end: days[days.length - 1].iso };
}

function formatAgendaMeta(event: PortalEvent): string {
  const parts: string[] = [];
  const time = formatTimeOfDay(event.start_time);
  if (time) parts.push(time);
  if (event.location?.trim()) parts.push(event.location.trim());
  return parts.join(" · ");
}

export function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [googleCalendarUrl, setGoogleCalendarUrl] = useState<string | null>(null);
  const [academicDriveUrl, setAcademicDriveUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchEvents()
      .then((data) => setEvents(data.items))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load events.");
      })
      .finally(() => setLoading(false));
    Promise.all([fetchResources("organizational"), fetchResources("academic")])
      .then(([orgData, academicData]) => {
        const links = resolvePortalLinks(academicData.items, orgData.items);
        setGoogleCalendarUrl(links.googleCalendar);
        setAcademicDriveUrl(links.academicDrive);
      })
      .catch(() => undefined);
  }, []);

  const weeks = useMemo(() => buildWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const monthEventCount = useMemo(
    () => events.filter((e) => eventOccursInMonth(e, viewYear, viewMonth)).length,
    [events, viewYear, viewMonth],
  );

  const singleDayByDate = useMemo(() => {
    const map = new Map<string, PortalEvent[]>();
    for (const event of events.filter(isSingleDayEvent)) {
      const list = map.get(event.starts_on) ?? [];
      list.push(event);
      map.set(event.starts_on, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => (a.start_time ?? "").localeCompare(b.start_time ?? ""));
    }
    return map;
  }, [events]);

  const rangeEvents = useMemo(() => events.filter(isMultiDayEvent), [events]);
  const rangeExams = useMemo(() => multiDayExams(), []);

  const upNext = useMemo(() => mergeUpcomingAgenda(events, new Date(), 8), [events]);

  const examSchedule = useMemo(() => allScheduledExams(), []);

  const upNextMonthLabel = useMemo(() => {
    if (upNext.length === 0) {
      return new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, { month: "long" });
    }
    const firstKey = upNext[0].sortKey.slice(0, 10);
    const first = new Date(`${firstKey}T12:00:00`);
    return first.toLocaleDateString(undefined, { month: "long" });
  }, [upNext, viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const showCalendar = !loading && !error;

  return (
    <PageShell>
      <PageHeader
        kicker="SCHEDULE"
        title="Calendar"
        subtitle="Assemblies, deadlines, and activities across Circuit."
        actions={
          googleCalendarUrl ? (
            <OutlinedExternalButton href={googleCalendarUrl} className="!w-auto">
              Open Google Calendar
            </OutlinedExternalButton>
          ) : null
        }
      />
      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!loading && events.length === 0 && examSchedule.length === 0 ? (
        <EmptyState message="No calendar events yet." />
      ) : null}

      {showCalendar ? (
        <div className={styles.calendarLayout}>
          <PortalCard className={styles.calendarMainCard}>
            <div className={styles.calendarCardHead}>
              <div>
                <h2 className={styles.calendarMonthTitle}>{monthLabel}</h2>
                <p className={styles.calendarMonthMeta}>
                  {monthEventCount} scheduled event{monthEventCount === 1 ? "" : "s"}
                </p>
              </div>
              <div className={styles.calendarNav}>
                <Button variant="secondary" onClick={goToday}>
                  Today
                </Button>
                <Button variant="secondary" onClick={prevMonth} aria-label="Previous month">
                  <Icon name="chevronLeft" size={18} />
                </Button>
                <Button variant="secondary" onClick={nextMonth} aria-label="Next month">
                  <Icon name="chevronRight" size={18} />
                </Button>
              </div>
            </div>

            <div className={styles.calendarBoard} aria-label="Month view">
            <div className={styles.calendarGrid}>
              {WEEKDAYS.map((day) => (
                <div key={day} className={styles.calendarWeekday}>
                  {day}
                </div>
              ))}
            </div>

            {weeks.map((week, weekIdx) => {
              const range = weekRangeIso(week);
              const weekRanges =
                range === null
                  ? []
                  : rangeEvents.filter(
                      (event) =>
                        event.starts_on <= range.end && eventEndDate(event) >= range.start,
                    );
              const weekExamRanges =
                range === null ? [] : rangeExams.filter((exam) => examOverlapsRange(exam, range));

              return (
                <div key={`week-${weekIdx}`} className={styles.calendarWeekBlock}>
                  <div className={styles.calendarWeekGrid}>
                    {week.map((cell, idx) => {
                      if (!cell) {
                        return (
                          <div
                            key={`empty-${weekIdx}-${idx}`}
                            className={`${styles.calendarDay} ${styles.calendarDayMuted}`}
                          />
                        );
                      }
                      const dayEvents = singleDayByDate.get(cell.iso) ?? [];
                      const dayExams = singleDayExamsOnDate(cell.iso);
                      const maxEvents = 3;
                      const examSlots = Math.max(0, maxEvents - dayEvents.length);
                      return (
                        <div
                          key={cell.iso}
                          className={`${styles.calendarDay} ${isToday(cell.date) ? styles.calendarDayToday : ""}`}
                        >
                          <span
                            className={`${styles.calendarDayNumber} ${isToday(cell.date) ? styles.calendarDayNumberToday : ""}`}
                          >
                            {cell.date.getDate()}
                          </span>
                          <div className={styles.calendarDayEvents}>
                            {dayEvents.slice(0, maxEvents).map((event) => {
                              const { styleKey } = resolveEventCategoryDisplay(event);
                              const chipClass =
                                styles[
                                  `calendarEventChip_${styleKey}` as keyof typeof styles
                                ] ?? styles.calendarEventChip_community;
                              const timeLabel = formatTimeOfDay(event.start_time);
                              return (
                                <Link
                                  key={event.id}
                                  to={`/calendar/${event.id}`}
                                  className={`${styles.calendarEventChip} ${chipClass} no-underline hover:no-underline`}
                                  title={event.title}
                                >
                                  <span className={styles.calendarEventChipTitle}>
                                    {event.title}
                                  </span>
                                  {timeLabel ? (
                                    <span className={styles.calendarEventChipTime}>
                                      {timeLabel}
                                    </span>
                                  ) : null}
                                </Link>
                              );
                            })}
                            {dayExams.slice(0, examSlots).map((exam) => {
                              const href = resolveExamUrl(exam, academicDriveUrl);
                              const timeLabel = formatExamTimeRange(exam.startTime, exam.endTime);
                              const label = examDisplayLabel(exam);
                              const chip = (
                                <>
                                  <span className={styles.calendarExamChipLabel}>EXAM</span>
                                  <span className={styles.calendarExamChipTitle}>{label}</span>
                                  {timeLabel ? (
                                    <span className={styles.calendarExamChipTime}>{timeLabel}</span>
                                  ) : null}
                                </>
                              );
                              return href ? (
                                <a
                                  key={examStableKey(exam)}
                                  href={href}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={styles.calendarExamChip}
                                  title={label}
                                >
                                  {chip}
                                </a>
                              ) : (
                                <span
                                  key={examStableKey(exam)}
                                  className={styles.calendarExamChip}
                                  title={label}
                                >
                                  {chip}
                                </span>
                              );
                            })}
                            {dayEvents.length + dayExams.length > maxEvents ? (
                              <span className={styles.calendarEventOverflow}>
                                +{dayEvents.length + dayExams.length - maxEvents} more
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(weekRanges.length > 0 || weekExamRanges.length > 0) && range ? (
                    <div className={styles.calendarWeekBars}>
                      {weekRanges.map((event) => {
                        const segStart =
                          event.starts_on < range.start ? range.start : event.starts_on;
                        const segEnd =
                          eventEndDate(event) > range.end ? range.end : eventEndDate(event);
                        const startCol = week.findIndex((c) => c?.iso === segStart);
                        const endCol = week.findIndex((c) => c?.iso === segEnd);
                        if (startCol < 0 || endCol < 0) return null;
                        const { styleKey } = resolveEventCategoryDisplay(event);
                        const barClass =
                          styles[`calendarRangeBar_${styleKey}` as keyof typeof styles] ??
                          styles.calendarRangeBar_community;
                        return (
                          <Link
                            key={`${event.id}-${weekIdx}`}
                            to={`/calendar/${event.id}`}
                            className={`${styles.calendarRangeBar} ${barClass}`}
                            style={{
                              gridColumn: `${startCol + 1} / ${endCol + 2}`,
                            }}
                            title={event.title}
                          >
                            {event.title}
                          </Link>
                        );
                      })}
                      {weekExamRanges.map((exam) => {
                        const segStart = exam.date < range.start ? range.start : exam.date;
                        const segEnd =
                          examEndDate(exam) > range.end ? range.end : examEndDate(exam);
                        const startCol = week.findIndex((c) => c?.iso === segStart);
                        const endCol = week.findIndex((c) => c?.iso === segEnd);
                        if (startCol < 0 || endCol < 0) return null;
                        const label = examDisplayLabel(exam);
                        const href = resolveExamUrl(exam, academicDriveUrl);
                        const barClass = `${styles.calendarRangeBar} ${styles.calendarExamRangeBar}`;
                        const gridStyle = { gridColumn: `${startCol + 1} / ${endCol + 2}` };
                        return href ? (
                          <a
                            key={`${examStableKey(exam)}-${weekIdx}`}
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className={`${barClass} no-underline hover:no-underline`}
                            style={gridStyle}
                            title={label}
                          >
                            {label}
                          </a>
                        ) : (
                          <span
                            key={`${examStableKey(exam)}-${weekIdx}`}
                            className={barClass}
                            style={gridStyle}
                            title={label}
                          >
                            {label}
                          </span>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
            </div>
          </PortalCard>

          <PortalCard>
            <Eyebrow>UP NEXT</Eyebrow>
            <p className={styles.calendarUpNextMonth}>{upNextMonthLabel}</p>
            {upNext.length === 0 ? (
              <div>
                <p className="m-0 text-sm font-medium text-circuit-navy">No upcoming events</p>
                <p className="mt-1 text-sm text-text-secondary">You&apos;re all caught up.</p>
              </div>
            ) : (
              <ul className={`m-0 list-none p-0 ${styles.calendarUpNextList}`}>
                {upNext.map((item) =>
                  item.kind === "event" ? (
                    <li key={`event-${item.event.id}`} className={styles.calendarAgendaRow}>
                      <EventDateBlock isoDate={item.event.starts_on} variant="agenda" />
                      <div className={styles.calendarAgendaRowBody}>
                        <EventCategoryTag event={item.event} />
                        <Link
                          to={`/calendar/${item.event.id}`}
                          className={`${styles.calendarAgendaTitleLink} ${styles.calendarAgendaTitle}`}
                        >
                          {item.event.title}
                        </Link>
                        <p className={styles.calendarAgendaMeta}>{formatAgendaMeta(item.event)}</p>
                      </div>
                    </li>
                  ) : (
                    <li
                      key={`exam-${examStableKey(item.exam)}`}
                      className={styles.calendarAgendaRow}
                    >
                      <EventDateBlock isoDate={item.exam.date} variant="agenda" />
                      <div className={styles.calendarAgendaRowBody}>
                        <span className={styles.calendarAgendaExamLabel}>EXAM</span>
                        <p className={styles.calendarAgendaTitle}>{examDisplayLabel(item.exam)}</p>
                        <p className={styles.calendarAgendaMeta}>{formatExamAgendaMeta(item.exam)}</p>
                      </div>
                    </li>
                  ),
                )}
              </ul>
            )}
            <div className={styles.calendarExamSchedulePanel}>
              <h3 className={styles.calendarExamScheduleTitle}>Course exam schedule</h3>
              <p className={styles.calendarExamScheduleCopy}>
                Official EEE exam dates—other year levels may share the same course.
              </p>
              <ul className={styles.calendarExamScheduleList}>
                {examSchedule.map((exam) => {
                  const href = resolveExamUrl(exam, academicDriveUrl);
                  const timeLabel = formatExamTimeRange(exam.startTime, exam.endTime);
                  const dateLabel = formatExamDateRange(exam);
                  return (
                    <li key={examStableKey(exam)} className={styles.calendarExamScheduleRow}>
                      <span>
                        {examDisplayLabel(exam)} · {dateLabel}
                        {timeLabel ? ` · ${timeLabel}` : ""}
                      </span>
                      {href ? (
                        <a href={href} target="_blank" rel="noreferrer" className="text-sm font-semibold">
                          Open →
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          </PortalCard>
        </div>
      ) : null}
    </PageShell>
  );
}
