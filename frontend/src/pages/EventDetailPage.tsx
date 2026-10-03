import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { fetchEvent, type PortalEvent } from "../api/events";
import { EmptyState, ExternalLink, PageShell, Spinner } from "../components/ui";
import { formatEventPeriod, formatTimeOfDay } from "../utils/eventDates";

function categoryLabel(category: string): string {
  const labels: Record<string, string> = {
    ACADEMIC: "Academic",
    MEMBERSHIP: "Membership",
    ORGANIZATION: "Organization",
    EVENT: "Event",
    DEADLINE: "Deadline",
  };
  return labels[category] ?? category;
}

export function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<PortalEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    fetchEvent(eventId)
      .then(setEvent)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load event.");
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  if (loading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    );
  }

  if (error || !event) {
    return (
      <PageShell>
        <EmptyState
          title="Event not found"
          message={error ? "This event could not be loaded." : "This event is not on the calendar."}
          action={
            <Link to="/calendar" className="text-bright-blue">
              Back to Calendar
            </Link>
          }
        />
      </PageShell>
    );
  }

  const startLabel = formatTimeOfDay(event.start_time);
  const endLabel = formatTimeOfDay(event.end_time);
  const timeLabel =
    startLabel && endLabel ? `${startLabel} – ${endLabel}` : (startLabel ?? endLabel);
  const location = event.location?.trim() || null;

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
        {timeLabel ? (
          <p className="mt-1 text-[0.9375rem] text-text-secondary">Time: {timeLabel}</p>
        ) : null}
        {location ? (
          <p className="mt-1 text-[0.9375rem] text-text-secondary">Location: {location}</p>
        ) : null}
      </header>

      {event.description ? (
        <p className="max-w-2xl text-text-secondary">{event.description}</p>
      ) : null}

      {event.link_url ? (
        <p className="mt-6">
          {event.link_url.startsWith("/") ? (
            <Link to={event.link_url} className="font-medium text-bright-blue">
              View details →
            </Link>
          ) : (
            <ExternalLink href={event.link_url}>Open link ↗</ExternalLink>
          )}
        </p>
      ) : null}
    </PageShell>
  );
}
