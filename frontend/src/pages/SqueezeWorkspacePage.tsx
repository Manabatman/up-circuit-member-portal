import { Link } from "react-router-dom";
import { useState } from "react";

import { SQUEEEZE_DEMO } from "../demo/squeeeze";
import { EmptyState, PageShell, ResourceRow, SectionHeader } from "../components/ui";
import styles from "../components/ui.module.css";

type Tab = "overview" | "resources" | "timeline" | "people";

export function SqueezeWorkspacePage() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <PageShell>
      <p className={styles.backLinkWrap}>
        <Link to="/projects">← Flagship Events</Link>
      </p>

      <header className={styles.workspaceHeader}>
        <h1 className="type-page-title m-0 text-[1.875rem] text-circuit-navy">{SQUEEEZE_DEMO.name}</h1>
        <p className={styles.workspaceSubtitle}>{SQUEEEZE_DEMO.subtitle}</p>
        <p className={styles.workspaceLead}>{SQUEEEZE_DEMO.overview}</p>
      </header>

      <nav className={styles.workspaceTabs} aria-label="Workspace sections">
        {(
          [
            ["overview", "Overview"],
            ["resources", "Resources"],
            ["timeline", "Timeline"],
            ["people", "People"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? styles.workspaceTabActive : styles.workspaceTab}
            onClick={() => setTab(id)}
            aria-current={tab === id ? "page" : undefined}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <section>
          <SectionHeader title="What's happening" />
          <div className={styles.infoPanel}>
            <p className={styles.infoPanelLabel}>Project status</p>
            <p className={styles.infoPanelValue}>{SQUEEEZE_DEMO.statusNote}</p>
          </div>
          <div className={styles.infoPanel}>
            <p className={styles.infoPanelLabel}>Upcoming milestone</p>
            <p className={styles.infoPanelValue}>{SQUEEEZE_DEMO.upcomingNote}</p>
          </div>
          <SectionHeader
            title="Your resources"
            subtitle="Quick links to external tools."
          />
          <ul className={styles.resourceRowList}>
            {SQUEEEZE_DEMO.resourceGroups[0].items.slice(0, 3).map((item) => (
              <ResourceRow
                key={item.title}
                title={item.title}
                description={item.description}
                url={item.url}
                resourceType={item.resourceType}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "resources" ? (
        <section>
          <SectionHeader
            title="Resources"
            subtitle="Grouped by purpose. Each link opens an external system."
          />
          {SQUEEEZE_DEMO.resourceGroups.map((group) => (
            <div key={group.name} className={styles.categorySection}>
              <h2 className={styles.categoryTitle}>{group.name}</h2>
              <ul className={styles.resourceRowList}>
                {group.items.map((item) => (
                  <ResourceRow
                    key={item.title}
                    title={item.title}
                    description={item.description}
                    url={item.url}
                    resourceType={item.resourceType}
                  />
                ))}
              </ul>
            </div>
          ))}
        </section>
      ) : null}

      {tab === "timeline" ? (
        <section>
          <SectionHeader title="Timeline" />
          <ul className={styles.eventDetailList}>
            {SQUEEEZE_DEMO.milestones.map((m) => (
              <li key={m.label}>
                <strong>{m.label}:</strong> {m.note}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {tab === "people" ? (
        <section>
          <SectionHeader title="People" />
          <EmptyState message="Team listings are not in the portal yet." />
        </section>
      ) : null}
    </PageShell>
  );
}
