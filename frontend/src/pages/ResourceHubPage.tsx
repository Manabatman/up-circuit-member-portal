import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";

import { ApiRequestError, type MeResponse } from "../api/auth";
import { fetchResources, type Resource } from "../api/resources";
import { ResourceEditorModal } from "../components/ResourceEditorModal";
import { Icon } from "../components/Icon";
import {
  AccessDenied,
  Button,
  ErrorState,
  PageHeader,
  PageShell,
  SearchInput,
  Spinner,
} from "../components/ui";
import {
  ORG_DOCUMENT_TILES,
  ORG_FOLDERS,
  ORG_REQUEST_TILES,
  resolveOrgTileUrl,
  type OrgFolderId,
} from "../content/orgResourceTiles";
import styles from "../components/ui.module.css";

const SEARCH_MIN_ITEMS = 8;

function parseFolder(value: string | null): OrgFolderId | null {
  if (value === "documents" || value === "requests") return value;
  return null;
}

export function ResourceHubPage({
  title,
  subtitle,
  kicker,
}: {
  title: string;
  subtitle: string;
  kicker?: string;
}) {
  const me = useOutletContext<MeResponse | null>();
  const canManage = Boolean(me?.permissions.includes("manage_organizational_resources"));
  const [searchParams, setSearchParams] = useSearchParams();
  const folder = parseFolder(searchParams.get("folder"));

  const [resources, setResources] = useState<Resource[]>([]);
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
    return fetchResources("organizational")
      .then((resourceData) => {
        setResources(resourceData.items);
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
  }, []);

  const filteredFolders = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return ORG_FOLDERS;
    return ORG_FOLDERS.filter(
      (f) =>
        f.label.toLowerCase().includes(q) || f.description.toLowerCase().includes(q),
    );
  }, [filter]);

  const folderMeta = ORG_FOLDERS.find((f) => f.id === folder);
  const tiles = folder === "documents" ? ORG_DOCUMENT_TILES : folder === "requests" ? ORG_REQUEST_TILES : [];

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
          message="Renew your membership to access organizational resources."
          showRenewalLink
        />
      </PageShell>
    );
  }

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

      {folder ? (
        <nav className={styles.resourcesBreadcrumb} aria-label="Breadcrumb">
          <button
            type="button"
            className={styles.resourcesBreadcrumbLink}
            onClick={() => setSearchParams({})}
          >
            Resources
          </button>
          <span aria-hidden>›</span>
          <span>{folderMeta?.label ?? folder}</span>
        </nav>
      ) : null}

      {!folder && resources.length >= SEARCH_MIN_ITEMS ? (
        <SearchInput value={filter} onChange={setFilter} placeholder="Search folders…" />
      ) : null}

      {error ? <ErrorState message={error} /> : null}

      {!folder ? (
        <div className={styles.orgFolderGrid}>
          {filteredFolders.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className={styles.orgFolderTile}
              onClick={() => setSearchParams({ folder: entry.id })}
            >
              <Icon name="drive" size={28} className="text-bright-blue" />
              <h2 className="m-0 text-lg font-semibold text-circuit-navy">{entry.label}</h2>
              <p className="m-0 text-sm text-text-secondary">{entry.description}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.orgTileGrid}>
          {tiles.map((tile) => {
            const href = resolveOrgTileUrl(tile, resources);
            if (!href) {
              return (
                <div key={tile.title} className={styles.orgResourceTile}>
                  <p className="m-0 font-semibold text-circuit-navy">{tile.title}</p>
                  {tile.description ? (
                    <p className="m-0 text-sm text-text-secondary">{tile.description}</p>
                  ) : null}
                  <span className="text-xs text-text-secondary">Link coming soon</span>
                </div>
              );
            }
            return (
              <a
                key={tile.title}
                href={href}
                target="_blank"
                rel="noreferrer"
                className={styles.orgResourceTile}
              >
                <p className="m-0 font-semibold text-circuit-navy">{tile.title}</p>
                {tile.description ? (
                  <p className="m-0 text-sm text-text-secondary">{tile.description}</p>
                ) : null}
                <span className="text-sm font-semibold text-bright-blue">Open →</span>
              </a>
            );
          })}
        </div>
      )}

      <ResourceEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void reloadResources()}
        scope="organizational"
        divisionId={null}
        resource={editingResource}
      />
    </PageShell>
  );
}

export function ResourcesPage() {
  return (
    <ResourceHubPage
      kicker="Discover"
      title="Resources"
      subtitle="Constitution, org documents, and other Circuit links."
    />
  );
}
