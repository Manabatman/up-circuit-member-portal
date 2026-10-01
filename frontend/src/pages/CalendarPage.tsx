import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { fetchEvents, type PortalEvent } from "../api/events";
import { Icon } from "../components/Icon";
import {
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  PageShell,
  Spinner,
} from "../components/ui";
import {
  categoryBarClass,
  eventEndDate,
  isMultiDayEvent,
  isSingleDayEvent,
} from "../utils/eventDates";
import styles from "../components/ui.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayCell = { date: Date; iso: string };

function buildWeeks(year: number, month: number): (DayCell | null)[][] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (DayCell | null)[] = [];
  for (let i = 0; i < startDay; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    cells.push({ date, iso: date.toISOString().slice(0, 10) });
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

export function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [events, setEvents] = useState<PortalEvent[]>([]);
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
  }, []);

  const weeks = useMemo(() => buildWeeks(viewYear, viewMonth), [viewYear, viewMonth]);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const singleDayByDate = useMemo(() => {
    const map = new Map<string, PortalEvent[]>();
    for (const event of events.filter(isSingleDayEvent)) {
      const list = map.get(event.starts_on) ?? [];
      list.push(event);
      map.set(event.starts_on, list);
    }
    return map;
  }, [events]);

  const rangeEvents = useMemo(() => events.filter(isMultiDayEvent), [events]);

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

  return (
    <PageShell>
      <PageHeader kicker="Discover" title="Calendar" subtitle="Upcoming Circuit activities and deadlines." />
      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}

      <div className={`${styles.calendarToolbar} mb-4`}>
        <h2 className="type-section-title m-0 text-lg text-circuit-navy">{monthLabel}</h2>
        <div className={styles.calendarNav}>
          <Button variant="secondary" onClick={prevMonth} aria-label="Previous month">
            <Icon name="chevronLeft" size={18} />
          </Button>
          <Button variant="secondary" onClick={goToday}>
            Today
          </Button>
          <Button variant="secondary" onClick={nextMonth} aria-label="Next month">
            <Icon name="chevronRight" size={18} />
          </Button>
        </div>
      </div>

      {!loading && events.length === 0 ? (
        <EmptyState message="No calendar events yet." />
      ) : null}

      <div className={styles.calendarGrid} aria-label="Month view">
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
                return (
                  <div
                    key={cell.iso}
                    className={`${styles.calendarDay} ${isToday(cell.date) ? styles.calendarDayToday : ""}`}
                  >
                    <span className={styles.calendarDayNumber}>{cell.date.getDate()}</span>
                    <div className={styles.calendarDayEvents}>
                      {dayEvents.slice(0, 2).map((event) => (
                        <Link
                          key={event.id}
                          to={`/calendar/${event.id}`}
                          className={`${styles.calendarEventDot} ${styles[categoryBarClass(event.category)]} no-underline hover:no-underline`}
                          title={event.title}
                        >
                          {event.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {weekRanges.length > 0 && range ? (
              <div className={styles.calendarWeekBars}>
                {weekRanges.map((event) => {
                  const segStart = event.starts_on < range.start ? range.start : event.starts_on;
                  const segEnd =
                    eventEndDate(event) > range.end ? range.end : eventEndDate(event);
                  const startCol = week.findIndex((c) => c?.iso === segStart);
                  const endCol = week.findIndex((c) => c?.iso === segEnd);
                  if (startCol < 0 || endCol < 0) return null;
                  return (
                    <Link
                      key={`${event.id}-${weekIdx}`}
                      to={`/calendar/${event.id}`}
                      className={`${styles.calendarRangeBar} ${styles[categoryBarClass(event.category)]}`}
                      style={{
                        gridColumn: `${startCol + 1} / ${endCol + 2}`,
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </PageShell>
  );
}
