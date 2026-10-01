import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { ApiRequestError, type MeResponse } from "../api/auth";
import {
  fetchResourceCategories,
  fetchResources,
  type Resource,
  type ResourceCategory,
} from "../api/resources";
import { VERIFIED_RESOURCE_TITLES } from "../constants";
import { ResourceEditorModal } from "../components/ResourceEditorModal";
import {
  AccessDenied,
  Button,
  EmptyState,
  ErrorState,
  PageHeader,
  PageShell,
  PrimaryExternalButton,
  ResourceRow,
  SearchInput,
  Spinner,
} from "../components/ui";
import styles from "../components/ui.module.css";

type Props = {
  scope: "academic" | "organizational";
  title: string;
  subtitle: string;
  kicker?: string;
};

const REQUESTS_CATEGORY_NAME = "Requests";
const SEARCH_MIN_ITEMS = 8;

export function ResourceHubPage({ scope, title, subtitle, kicker }: Props) {
  const me = useOutletContext<MeResponse | null>();
  const managePermission =
    scope === "academic" ? "manage_academic_resources" : "manage_organizational_resources";
  const canManage = Boolean(me?.permissions.includes(managePermission));

  const [resources, setResources] = useState<Resource[]>([]);
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [membershipRequired, setMembershipRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  function reloadResources() {
    setLoading(true);
    setMembershipRequired(false);
    setError(null);
    const loadResources = fetchResources(scope);
    const loadCategories =
      scope === "organizational" ? fetchResourceCategories("organizational") : Promise.resolve(null);
    return Promise.all([loadResources, loadCategories])
      .then(([resourceData, categoryData]) => {
        setResources(resourceData.items);
        setCategories(categoryData?.items ?? []);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiRequestError && err.code === "MEMBERSHIP_REQUIRED") {
          setMembershipRequired(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load resources.");
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    void reloadResources();
  }, [scope]);

  const featuredAcademicDrive = useMemo(() => {
    if (scope !== "academic") return null;
    return resources.find((r) => r.title === VERIFIED_RESOURCE_TITLES.academicDrive) ?? null;
  }, [resources, scope]);

  const featuredItems = useMemo(
    () => resources.filter((r) => r.is_featured && r.id !== featuredAcademicDrive?.id),
    [resources, featuredAcademicDrive],
  );

  const listResources = useMemo(() => {
    const featuredIds = new Set([
      ...(featuredAcademicDrive ? [featuredAcademicDrive.id] : []),
      ...featuredItems.map((r) => r.id),
    ]);
    return resources.filter((r) => !featuredIds.has(r.id));
  }, [resources, featuredAcademicDrive, featuredItems]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return listResources;
    return listResources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false) ||
        r.category.name.toLowerCase().includes(q),
    );
  }, [listResources, filter]);

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

  const requestsCategory = categories.find(
    (category) => category.name === REQUESTS_CATEGORY_NAME && category.is_active,
  );
  const hasRequestsResources = resources.some(
    (resource) => resource.category.name === REQUESTS_CATEGORY_NAME,
  );
  const showRequestsEmpty =
    scope === "organizational" &&
    !filter.trim() &&
    requestsCategory &&
    !hasRequestsResources;

  if (loading) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    );
  }

  if (membershipRequired) {
    return (
      <PageShell>
        <PageHeader title={title} subtitle={subtitle} kicker={kicker} />
        <AccessDenied
          title="Membership renewal required"
          message="Renew your membership to access the Academic Drive."
          showRenewalLink
        />
      </PageShell>
    );
  }

  const hasVisibleContent =
    featuredAcademicDrive !== null || grouped.length > 0 || showRequestsEmpty;

  return (
    <PageShell>
      <PageHeader title={title} subtitle={subtitle} kicker={kicker} />

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

      {scope === "academic" && featuredAcademicDrive && !filter.trim() ? (
        <section className={styles.academicDriveFeatured}>
          <h2 className={styles.academicDriveFeaturedTitle}>Your central hub for academic materials</h2>
          <p className={styles.academicDriveFeaturedBody}>
            The official Google Drive remains the source of truth. Use the portal to discover featured
            materials, then open the full drive when you need everything.
          </p>
          <PrimaryExternalButton href={featuredAcademicDrive.url}>
            Open Full Academic Drive ↗
          </PrimaryExternalButton>
        </section>
      ) : null}

      {scope === "academic" && featuredItems.length > 0 && !filter.trim() ? (
        <section className={styles.featuredResourceGrid}>
          <h2 className={styles.categoryTitle}>Featured materials</h2>
          <ul className={styles.resourceRowList}>
            {featuredItems.map((resource) => (
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
      ) : null}

      {resources.length >= SEARCH_MIN_ITEMS ? (
        <SearchInput value={filter} onChange={setFilter} placeholder="Search resources…" />
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      {!error && !hasVisibleContent ? (
        <EmptyState
          title="No resources yet"
          message={
            filter.trim()
              ? "No resources matched your search."
              : "Official Circuit resources will appear here when published by officers."
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

      {showRequestsEmpty ? (
        <section className={styles.categorySection}>
          <h2 className={styles.categoryTitle}>{REQUESTS_CATEGORY_NAME}</h2>
          <EmptyState
            title="Request forms coming soon"
            message="No request forms are currently available. Check back once the official forms are published."
          />
        </section>
      ) : null}

      <ResourceEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void reloadResources()}
        scope={scope}
        divisionId={null}
        resource={editingResource}
      />
    </PageShell>
  );
}

export function AcademicDrivePage() {
  return (
    <ResourceHubPage
      scope="academic"
      kicker="Discover"
      title="Academic Drive"
      subtitle="A curated front door to the official Academic Drive."
    />
  );
}

export function ResourcesPage() {
  return (
    <ResourceHubPage
      scope="organizational"
      kicker="Discover"
      title="Resources"
      subtitle="Constitution, org documents, and other Circuit links."
    />
  );
}
