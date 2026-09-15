import { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";

import type { MeResponse } from "../api/auth";

import { fetchDivision, type Division } from "../api/divisions";
import { fetchResources, type Resource } from "../api/resources";
import { ResourceEditorModal } from "../components/ResourceEditorModal";
import {
  Button,
  DivisionHero,
  EmptyState,
  ErrorState,
  PageShell,
  ResourceRow,
  SearchInput,
  Spinner,
  SectionHeader,
} from "../components/ui";
import styles from "../components/ui.module.css";

const SEARCH_MIN_ITEMS = 8;

export function DivisionDetailPage() {
  const me = useOutletContext<MeResponse>();
  const canManage = me.permissions.includes("manage_organizational_resources");
  const { divisionId } = useParams<{ divisionId: string }>();
  const [division, setDivision] = useState<Division | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  function reloadDivision() {
    if (!divisionId) return Promise.resolve();
    setLoading(true);
    setError(null);
    return Promise.all([fetchDivision(divisionId), fetchResources("organizational", false, divisionId)])
      .then(([divisionData, resourceData]) => {
        setDivision(divisionData);
        setResources(resourceData.items);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load division.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void reloadDivision();
  }, [divisionId]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return resources;
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false) ||
        r.category.name.toLowerCase().includes(q),
    );
  }, [resources, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, Resource[]>();
    for (const resource of filtered) {
      const key = resource.category.name;
      const list = map.get(key) ?? [];
      list.push(resource);
      map.set(key, list);
    }
    return [...map.entries()].sort(
      (a, b) =>
        (a[1][0]?.category.display_order ?? 0) - (b[1][0]?.category.display_order ?? 0),
    );
  }, [filtered]);

  if (loading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    );
  }

  if (error || !division) {
    return (
      <PageShell>
        <ErrorState message={error ?? "Division not found."} />
        <p>
          <Link to="/divisions">Back to Divisions</Link>
        </p>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <p className={styles.backLinkWrap}>
        <Link to="/divisions">← All divisions</Link>
      </p>

      <DivisionHero divisionName={division.name} description={division.description} />

      <SectionHeader title="Resources" subtitle="Links and materials for this division." />

      {canManage ? (
        <div className={styles.contextualAdminBar}>
          <Button
            type="button"
            onClick={() => {
              setEditingResource(null);
              setEditorOpen(true);
            }}
          >
            + Add resource
          </Button>
        </div>
      ) : null}

      {resources.length >= SEARCH_MIN_ITEMS ? (
        <SearchInput
          value={filter}
          onChange={setFilter}
          placeholder="Search division resources…"
        />
      ) : null}

      {grouped.length === 0 ? (
        <EmptyState
          title="Division resources are coming soon"
          message={
            filter.trim()
              ? "No resources matched your search."
              : "No resources for this division yet."
          }
          action={
            filter.trim() ? undefined : (
              <Link to="/resources">Browse global Resources</Link>
            )
          }
        />
      ) : null}

      {grouped.map(([categoryName, items]) => (
        <section key={categoryName} className={styles.categorySection}>
          <h2 className={styles.categoryTitle}>{categoryName}</h2>
          <ul className={styles.resourceRowList}>
            {items.map((resource) => (
              <ResourceRow
                key={resource.id}
                title={resource.title}
                description={resource.description}
                url={resource.url}
                resourceType={resource.resource_type}
                onEdit={
                  canManage
                    ? () => {
                        setEditingResource(resource);
                        setEditorOpen(true);
                      }
                    : undefined
                }
              />
            ))}
          </ul>
        </section>
      ))}

      {divisionId ? (
        <ResourceEditorModal
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSaved={() => void reloadDivision()}
          scope="organizational"
          divisionId={divisionId}
          resource={editingResource}
        />
      ) : null}
    </PageShell>
  );
}
