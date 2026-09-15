import { Link, useParams } from "react-router-dom";

import { categoryLabel, formatEventPeriod, getDemoEvent } from "../demo/calendar";
import { EmptyState, PageShell } from "../components/ui";

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const event = eventId ? getDemoEvent(eventId) : undefined;

  if (!event) {
    return (
      <PageShell>
        <EmptyState
          title="Event not found"
          message="This event is not on the calendar."
          action={<Link to="/calendar">Back to Calendar</Link>}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className="mb-6 text-sm">
        <Link to="/calendar" className="text-bright-blue no-underline hover:underline">
          ← Calendar
        </Link>
      </p>

      <header className="mb-8 border-b border-border/60 pb-6">
        <p className="mb-2 text-xs font-medium tracking-wide text-text-secondary">
          {categoryLabel(event.category)}
        </p>
        <h1 className="type-page-title m-0 text-[1.875rem] leading-tight text-circuit-navy">
          {event.title}
        </h1>
        <p className="mt-3 text-[0.9375rem] text-text-secondary">{formatEventPeriod(event)}</p>
      </header>
    </PageShell>
  );
}
