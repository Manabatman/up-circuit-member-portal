import { useEffect, useMemo, useState } from "react";

import { fetchEvents, type PortalEvent } from "../api/events";
import { ErrorState, PageHeader, PageShell, ProjectCard, Spinner } from "../components/ui";
import { DEMO_PROJECTS } from "../demo/projects";
import { formatEventPeriod } from "../utils/eventDates";

export type FlagshipCard = {
  key: string;
  projectId: string;
  name: string;
  tagline: string;
  to?: string;
  comingSoon: boolean;
};

export function buildFlagshipCards(events: PortalEvent[]): FlagshipCard[] {
  return DEMO_PROJECTS.map((catalog) => {
    const event = events.find(
      (e) => e.title.trim().toLowerCase() === catalog.name.trim().toLowerCase(),
    );
    const to = event?.link_url ?? catalog.path;
    const comingSoon = event ? !event.link_url : catalog.status === "coming-soon";
    return {
      key: catalog.id,
      projectId: catalog.id,
      name: event?.title ?? catalog.name,
      tagline:
        event?.description ??
        catalog.tagline ??
        (event ? formatEventPeriod(event) : ""),
      to: comingSoon ? undefined : to,
      comingSoon,
    };
  });
}

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

  const cards = useMemo(() => buildFlagshipCards(events), [events]);
  const featured = cards[0];
  const rest = cards.slice(1);

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Flagship Events"
        subtitle="UP Circuit's flagship events and initiatives."
      />
      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}

      {featured ? (
        <section className="mb-10">
          <ProjectCard
            projectId={featured.projectId}
            name={featured.name}
            tagline={featured.tagline}
            to={featured.to}
            featured
            comingSoon={featured.comingSoon}
          />
        </section>
      ) : null}

      {rest.length > 0 ? (
        <section>
          <h2 className="type-section-title mb-4 text-sm text-circuit-navy">More flagship events</h2>
          <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
            {rest.map((card) => (
              <li key={card.key}>
                <ProjectCard
                  projectId={card.projectId}
                  name={card.name}
                  tagline={card.tagline}
                  to={card.to}
                  comingSoon={card.comingSoon}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </PageShell>
  );
}
