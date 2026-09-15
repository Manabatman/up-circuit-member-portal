import { useEffect, useState } from "react";

import { fetchDivisions, type Division } from "../api/divisions";
import { fetchResources } from "../api/resources";
import {
  DivisionCardLink,
  EmptyState,
  ErrorState,
  PageHeader,
  PageShell,
  Spinner,
} from "../components/ui";
import styles from "../components/ui.module.css";

export function DivisionsPage() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [resourceCounts, setResourceCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDivisions()
      .then(async (data) => {
        setDivisions(data.items);
        const counts: Record<string, number> = {};
        await Promise.all(
          data.items.map(async (division) => {
            try {
              const resources = await fetchResources("organizational", false, division.id);
              counts[division.id] = resources.items.length;
            } catch {
              counts[division.id] = 0;
            }
          }),
        );
        setResourceCounts(counts);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load divisions.");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Divisions"
        subtitle="Explore Circuit groups and the six standing divisions."
      />
      {error ? <ErrorState message={error} /> : null}
      {!error && divisions.length === 0 ? (
        <EmptyState
          title="No hubs yet"
          message="Division and group pages will appear here once they are available."
          action={<a href="/resources">Browse Resources</a>}
        />
      ) : null}
      {!error && divisions.length > 0 ? (
        <ul className={styles.divisionGrid}>
          {divisions.map((division) => (
            <li
              key={division.id}
              className={!division.is_standing_division ? styles.divisionFeaturedItem : undefined}
            >
              <DivisionCardLink
                to={`/divisions/${division.id}`}
                divisionName={division.name}
                description={division.description}
                resourceCount={resourceCounts[division.id]}
                exploreLabel={
                  division.is_standing_division ? "Explore division" : "Explore hub"
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </PageShell>
  );
}
