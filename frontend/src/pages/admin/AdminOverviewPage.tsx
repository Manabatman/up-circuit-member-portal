import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { fetchAdminOverview, type AdminOverview } from "../../api/admin";
import { ADMIN_MEMBERS_PATH } from "../../constants";
import {
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  PageShell,
  Spinner,
  StatusBadge,
} from "../../components/ui";
import styles from "../../components/ui.module.css";

export function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminOverview()
      .then(setData)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load overview.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <PageHeader
        kicker="Administration"
        title="Overview"
        subtitle="What needs your attention right now."
      />
      {loading ? <Spinner /> : null}
      {error ? <ErrorState message={error} /> : null}
      {data ? (
        <>
          <div className={styles.adminStatGrid}>
            <Card className={styles.adminStatCard}>
              <p className={styles.adminStatLabel}>Total members</p>
              <p className={styles.adminStatValue}>{data.total_members}</p>
            </Card>
            <Card className={styles.adminStatCard}>
              <p className={styles.adminStatLabel}>Pending approval</p>
              <p className={styles.adminStatValue}>{data.pending_members}</p>
            </Card>
            <Card className={styles.adminStatCard}>
              <p className={styles.adminStatLabel}>Renewed</p>
              <p className={styles.adminStatValue}>{data.renewed_members}</p>
            </Card>
            <Card className={styles.adminStatCard}>
              <p className={styles.adminStatLabel}>Not renewed</p>
              <p className={styles.adminStatValue}>{data.not_renewed_members}</p>
            </Card>
          </div>

          <section className="mt-8">
            <h2 className="type-section-title mb-3 text-circuit-navy">Pending members</h2>
            {data.pending_members === 0 ? (
              <EmptyState message="You're all caught up — no pending members." />
            ) : (
              <Card>
                <p className="m-0 text-sm text-text-secondary">
                  {data.pending_members} member(s) need membership review.{" "}
                  <Link to={ADMIN_MEMBERS_PATH} className="font-medium text-bright-blue">
                    Review members →
                  </Link>
                </p>
              </Card>
            )}
          </section>

          <section className="mt-8">
            <h2 className="type-section-title mb-3 text-circuit-navy">Recent registrations</h2>
            {data.recent_registrations.length === 0 ? (
              <EmptyState message="No new registrations in the last 7 days." />
            ) : (
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent_registrations.map((member) => (
                      <tr key={member.user_id}>
                        <td>{member.full_name}</td>
                        <td className={styles.muted}>{member.email}</td>
                        <td>
                          <StatusBadge status={member.membership_status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
