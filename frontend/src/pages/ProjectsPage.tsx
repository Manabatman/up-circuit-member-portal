import { useEffect, useState } from "react";

import { fetchEvents, type PortalEvent } from "../api/events";
import { EmptyState, ErrorState, PageHeader, PageShell, ProjectCard, Spinner } from "../components/ui";
import { formatEventPeriod } from "../utils/eventDates";

export function ProjectsPage() {
  const [events, setEvents] = useState<PortalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents({ flagship: true })
      .then((data) => setEvents(data.items))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load flagship events.");
      })
      .finally(() => setLoading(false));
  }, []);

  const featured = events[0];
  const rest = events.slice(1);

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Flagship Events"
        subtitle="UP Circuit's flagship events and initiatives."
      />
      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && events.length === 0 ? (
        <EmptyState message="No flagship events published yet." />
      ) : null}

      {featured ? (
        <section className="mb-10">
          <ProjectCard
            projectId={featured.image_url ? featured.title.toLowerCase().replace(/\s+/g, "-") : featured.id}
            name={featured.title}
            tagline={featured.description ?? formatEventPeriod(featured)}
            to={featured.link_url ?? `/calendar/${featured.id}`}
            featured
          />
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section>
          <h2 className="type-section-title mb-4 text-sm text-circuit-navy">More flagship events</h2>
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {rest.map((event) => (
              <li key={event.id}>
                <ProjectCard
                  projectId={event.id}
                  name={event.title}
                  tagline={event.description ?? formatEventPeriod(event)}
                  to={event.link_url ?? `/calendar/${event.id}`}
                  comingSoon={!event.link_url}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
