import { useEffect, useMemo, useState } from "react";

import { fetchDivisions, type Division } from "../api/divisions";
import { fetchMembers, type MemberDirectory } from "../api/members";
import {
  Avatar,
  EmptyState,
  ErrorState,
  PageHeader,
  PageShell,
  SearchInput,
  Select,
  Spinner,
  StatusBadge,
} from "../components/ui";
import { shortDivisionName } from "../content/divisionVisuals";
import styles from "../components/ui.module.css";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export function DirectoryPage() {
  const [members, setMembers] = useState<MemberDirectory[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [query, setQuery] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const debouncedQuery = useDebouncedValue(query, 300);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDivisions()
      .then((data) => setDivisions(data.items.filter((d) => d.is_standing_division)))
      .catch(() => setDivisions([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchMembers(debouncedQuery || undefined, undefined, divisionFilter || undefined)
      .then((data) => setMembers(data.items as MemberDirectory[]))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load directory.");
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery, divisionFilter]);

  const divisionOptions = useMemo(
    () => [
      { value: "", label: "All divisions" },
      ...divisions.map((d) => ({
        value: d.id,
        label: shortDivisionName(d.name),
      })),
    ],
    [divisions],
  );

  return (
    <PageShell>
      <PageHeader
        kicker="Discover"
        title="Members"
        subtitle="Find members by name and see which division they are listed under."
      />

      <div className={styles.directoryFilters}>
        <SearchInput value={query} onChange={setQuery} placeholder="Search by name…" />
        <label className={styles.directoryFilterLabel}>
          <span className={styles.srOnly}>Filter by division</span>
          <Select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            aria-label="Filter by division"
          >
            {divisionOptions.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}
      {!loading && !error && members.length === 0 ? (
        <EmptyState
          title="No members found"
          message={
            query.trim() || divisionFilter
              ? "No members matched your search or filter."
              : "No members are in the directory yet."
          }
        />
      ) : null}

      {!loading && !error && members.length > 0 ? (
        <>
          <div className={styles.directoryCards}>
            {members.map((member) => (
              <article key={member.user_id} className={styles.directoryCard}>
                <Avatar name={member.full_name} size="md" />
                <div className={styles.directoryCardBody}>
                  <h2 className={styles.directoryCardName}>{member.full_name}</h2>
                  <p className={styles.directoryCardMeta}>
                    {[member.degree_program, member.year_level ? `Year ${member.year_level}` : null, member.batch]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                  {member.primary_division_name ? (
                    <p className={styles.directoryCardDivision}>
                      {shortDivisionName(member.primary_division_name)}
                    </p>
                  ) : null}
                  <StatusBadge status={member.membership_status} />
                </div>
              </article>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Division</th>
                  <th>Program</th>
                  <th>Year</th>
                  <th>Batch</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.user_id}>
                    <td>{member.full_name}</td>
                    <td>
                      {member.primary_division_name
                        ? shortDivisionName(member.primary_division_name)
                        : "—"}
                    </td>
                    <td>{member.degree_program ?? "—"}</td>
                    <td>{member.year_level ?? "—"}</td>
                    <td>{member.batch ?? "—"}</td>
                    <td>
                      <StatusBadge status={member.membership_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </PageShell>
  );
}
