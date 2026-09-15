import { Link } from "react-router-dom";
import { useMemo, useState } from "react";

import {
  eventSpansDate,
  getEventsForDate,
  getRangeEventsForMonth,
  type DemoCalendarEvent,
} from "../demo/calendar";
import { Icon } from "../components/Icon";
import { Button, PageHeader, PageShell } from "../components/ui";
import styles from "../components/ui.module.css";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_EVENTS_PER_CELL = 2;

function accentBarClass(category: DemoCalendarEvent["category"]): string {
  if (category === "academic") return styles.calendarEventDot_academic;
  if (category === "org") return styles.calendarEventDot_org;
  return styles.calendarEventDot_project;
}

function rangeDayClass(category: DemoCalendarEvent["category"]): string {
  if (category === "academic") return styles.calendarRangeDay_academic;
  if (category === "org") return styles.calendarRangeDay_org;
  return styles.calendarRangeDay_project;
}

export function CalendarPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const rangeEvents = useMemo(
    () => getRangeEventsForMonth(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const calendarCells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: { date: Date | null; iso: string | null }[] = [];

    for (let i = 0; i < startDay; i += 1) {
      cells.push({ date: null, iso: null });
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(viewYear, viewMonth, day);
      cells.push({ date, iso: date.toISOString().slice(0, 10) });
    }
    return cells;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  function dayCellClasses(iso: string, date: Date): string {
    const classes = [styles.calendarDay];
    if (isToday(date)) classes.push(styles.calendarDayToday);

    const activeRanges = rangeEvents.filter((e) => eventSpansDate(e, iso));
    if (activeRanges.length > 0) {
      classes.push(styles.calendarRangeDay);
      classes.push(rangeDayClass(activeRanges[0].category));
    }
    return classes.join(" ");
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Calendar"
        subtitle="Sample schedule for beta testing — not the official Circuit calendar."
      />

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

      <div className={styles.calendarGrid} aria-label="Month view">
        {WEEKDAYS.map((day) => (
          <div key={day} className={styles.calendarWeekday}>
            {day}
          </div>
        ))}
        {calendarCells.map((cell, idx) => {
          if (!cell.date || !cell.iso) {
            return (
              <div
                key={`empty-${idx}`}
                className={`${styles.calendarDay} ${styles.calendarDayMuted}`}
              />
            );
          }
          const dayEvents = getEventsForDate(cell.iso);
          const visible = dayEvents.slice(0, MAX_EVENTS_PER_CELL);
          const overflow = dayEvents.length - visible.length;
          return (
            <div key={cell.iso} className={dayCellClasses(cell.iso, cell.date)}>
              <span className={styles.calendarDayNumber}>{cell.date.getDate()}</span>
              <div className={styles.calendarDayEvents}>
                {visible.map((event) => (
                  <Link
                    key={event.id}
                    to={`/calendar/${event.id}`}
                    className={`${styles.calendarEventDot} ${accentBarClass(event.category)} no-underline hover:no-underline`}
                    title={event.title}
                  >
                    {event.title}
                  </Link>
                ))}
                {overflow > 0 ? (
                  <span className={styles.calendarEventOverflow}>+{overflow} more</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
