import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import { ApiRequestError, type MeResponse } from "../api/auth";
import { fetchResources, type Resource } from "../api/resources";
import { VERIFIED_RESOURCE_TITLES } from "../constants";
import { ResourceEditorModal } from "../components/ResourceEditorModal";
import { Icon } from "../components/Icon";
import {
  AccessDenied,
  Button,
  EmptyState,
  ErrorState,
  Eyebrow,
  PageHeader,
  PageShell,
  EventDateBlock,
  PrimaryExternalButton,
  SearchInput,
  Spinner,
} from "../components/ui";
import { resolvePortalLinks } from "../utils/portalLinks";
import {
  courseCatalog,
  examArchives,
  formatExamDateShort,
  formatExamTimeRange,
  resolveArchiveUrl,
  upcomingExams,
} from "../utils/examSchedule";
import styles from "../components/ui.module.css";

const ALL_COURSES = "All Courses";

export function AcademicDrivePage() {
  const me = useOutletContext<MeResponse | null>();
  const canManage = Boolean(me?.permissions.includes("manage_academic_resources"));

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [membershipRequired, setMembershipRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [courseFilter, setCourseFilter] = useState(ALL_COURSES);
  const [archiveFilter, setArchiveFilter] = useState(ALL_COURSES);
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  function reloadResources() {
    setLoading(true);
    setMembershipRequired(false);
    setError(null);
    return fetchResources("academic")
      .then((data) => setResources(data.items))
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

  const academicDriveUrl = useMemo(() => {
    const links = resolvePortalLinks(resources, []);
    return links.academicDrive;
  }, [resources]);

  const studyNext = useMemo(() => upcomingExams(), []);

  const catalog = useMemo(() => courseCatalog(), []);

  const courseOptions = useMemo(() => {
    const codes = new Set(catalog.map((c) => c.courseCode));
    return [ALL_COURSES, ...[...codes].sort()];
  }, [catalog]);

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog.filter((entry) => {
      if (courseFilter !== ALL_COURSES && entry.courseCode !== courseFilter) return false;
      if (!q) return true;
      return (
        entry.courseCode.toLowerCase().includes(q) ||
        entry.courseName.toLowerCase().includes(q)
      );
    });
  }, [catalog, courseFilter, search]);

  const recentlyAdded = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...resources]
      .filter((r) => r.title !== VERIFIED_RESOURCE_TITLES.academicDrive)
      .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    if (!q) return sorted;
    return sorted.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false) ||
        r.category.name.toLowerCase().includes(q),
    );
  }, [resources, search]);

  const archives = useMemo(() => {
    const rows = examArchives();
    if (archiveFilter === ALL_COURSES) return rows;
    return rows.filter((row) => row.courseCode === archiveFilter);
  }, [archiveFilter]);

  const showTermColumn = archives.some((row) => Boolean(row.term));

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
        <PageHeader
          kicker="DISCOVER"
          title="Academic Drive"
          subtitle="A curated front door to the official Academic Drive."
        />
        <AccessDenied
          title="Membership renewal required"
          message="Renew your membership to access the Academic Drive."
          showRenewalLink
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        kicker="DISCOVER"
        title="Academic Drive"
        subtitle="A curated front door to the official Academic Drive."
        actions={
          <>
            {canManage ? (
              <Button
                type="button"
                onClick={() => {
                  setEditingResource(null);
                  setEditorOpen(true);
                }}
              >
                + Add resource
              </Button>
            ) : null}
            {academicDriveUrl ? (
              <PrimaryExternalButton href={academicDriveUrl}>
                Open Full Academic Drive
              </PrimaryExternalButton>
            ) : null}
          </>
        }
      />

      {error ? <ErrorState message={error} /> : null}

      <section className={`${styles.academicDriveSection} ${styles.academicDriveStudyNext}`}>
        <Eyebrow>CURRENT PRIORITIES</Eyebrow>
        <h2 className={styles.dashboardSectionTitle}>Study Next</h2>
        {studyNext.length === 0 ? (
          <div className={styles.academicDriveStudyEmpty}>
            No upcoming exams in the next two weeks. Check Browse by Course for materials.
          </div>
        ) : (
          <div className={styles.academicDriveStudyGrid}>
            {studyNext.map((exam) => (
              <article
                key={`${exam.courseCode}-${exam.date}-${exam.examName}`}
                className={styles.academicDriveStudyCard}
              >
                <EventDateBlock isoDate={exam.date} variant="agenda" />
                <div className={styles.academicDriveStudyCardBody}>
                  <p className={styles.academicDriveStudyCourse}>{exam.courseCode}</p>
                  <p className={styles.academicDriveStudyTitle}>{exam.examName}</p>
                  <p className={styles.academicDriveStudyMeta}>
                    {formatExamTimeRange(exam.startTime, exam.endTime)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.academicDriveSection}>
        <div className={styles.academicDriveSectionHead}>
          <div>
            <Eyebrow>BROWSE</Eyebrow>
            <h2 className={styles.dashboardSectionTitle}>Browse by Course</h2>
          </div>
        </div>
        <div className={styles.academicDriveFilters}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search courses or resources…"
          />
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Course
            <select
              className="rounded-md border border-border px-2 py-1.5 text-sm"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
            >
              {courseOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>
        {filteredCatalog.length === 0 ? (
          <EmptyState message="No courses matched your filters." />
        ) : (
          <div className={styles.courseCardGrid}>
            {filteredCatalog.map((entry) => (
              <article key={entry.courseCode} className={styles.courseCard}>
                <div className={styles.courseCardTop}>
                  <Icon name="drive" size={22} className="text-bright-blue" />
                  {canManage ? (
                    <button
                      type="button"
                      className="border-0 bg-transparent p-1 text-text-secondary"
                      aria-label={`Manage ${entry.courseCode}`}
                      onClick={() => {
                        setEditingResource(null);
                        setEditorOpen(true);
                      }}
                    >
                      <Icon name="menu" size={18} />
                    </button>
                  ) : null}
                </div>
                <p className={styles.courseCardCode}>{entry.courseCode}</p>
                <p className={styles.courseCardName}>{entry.courseName}</p>
                {entry.resourceSummary ? (
                  <p className={styles.courseCardSummary}>{entry.resourceSummary}</p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.academicDriveSection}>
        <Eyebrow>UPDATES</Eyebrow>
        <h2 className={styles.dashboardSectionTitle}>Recently Added</h2>
        {recentlyAdded.length === 0 ? (
          <EmptyState message="No portal resources yet. Open the full Academic Drive for all materials." />
        ) : (
          <ul className={styles.recentlyAddedList}>
            {recentlyAdded.map((resource) => (
              <li key={resource.id} className={styles.recentlyAddedRow}>
                <div>
                  <p className="m-0 font-semibold text-circuit-navy">{resource.title}</p>
                  <p className="m-0 text-xs text-text-secondary">
                    {resource.category.name}
                    {resource.created_at
                      ? ` · ${formatExamDateShort(resource.created_at.slice(0, 10))}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canManage ? (
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        setEditingResource(resource);
                        setEditorOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                  ) : null}
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-bright-blue no-underline"
                  >
                    Open →
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.academicDriveSection}>
        <div className={styles.academicDriveSectionHead}>
          <div>
            <Eyebrow>ARCHIVES</Eyebrow>
            <h2 className={styles.dashboardSectionTitle}>Exam Archives</h2>
          </div>
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            Course
            <select
              className="rounded-md border border-border px-2 py-1.5 text-sm"
              value={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.value)}
            >
              {courseOptions.map((code) => (
                <option key={`arch-${code}`} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
        </div>
        <ul className={styles.examArchivesMobileList}>
          {archives.map((row) => {
            const href = resolveArchiveUrl(row, academicDriveUrl);
            return (
              <li key={`m-${row.courseCode}-${row.examName}-${row.term ?? ""}`} className={styles.examArchiveMobileCard}>
                <p className={styles.examArchiveMobileLabel}>Course</p>
                <p className={styles.examArchiveMobileValue}>{row.courseCode}</p>
                <p className={styles.examArchiveMobileLabel}>Assessment</p>
                <p className={styles.examArchiveMobileValue}>{row.examName}</p>
                {showTermColumn ? (
                  <>
                    <p className={styles.examArchiveMobileLabel}>Term</p>
                    <p className={styles.examArchiveMobileValue}>{row.term ?? "—"}</p>
                  </>
                ) : null}
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className={styles.examArchiveMobileOpen}>
                    Open →
                  </a>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className={styles.examArchivesTableWrap}>
          <table className={styles.examArchivesTable}>
            <thead>
              <tr>
                <th scope="col">Course</th>
                <th scope="col">Assessment</th>
                {showTermColumn ? <th scope="col">Term</th> : null}
                <th scope="col">Open</th>
              </tr>
            </thead>
            <tbody>
              {archives.map((row) => {
                const href = resolveArchiveUrl(row, academicDriveUrl);
                return (
                  <tr key={`${row.courseCode}-${row.examName}-${row.term ?? ""}`}>
                    <td>{row.courseCode}</td>
                    <td>{row.examName}</td>
                    {showTermColumn ? <td>{row.term ?? "—"}</td> : null}
                    <td>
                      {href ? (
                        <a href={href} target="_blank" rel="noreferrer">
                          Open →
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <ResourceEditorModal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSaved={() => void reloadResources()}
        scope="academic"
        divisionId={null}
        resource={editingResource}
      />
    </PageShell>
  );
}
