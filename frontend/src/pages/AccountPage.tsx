import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { fetchOwnMembership, fetchOwnProfile, type MemberSelf, type MembershipSelf } from "../api/members";
import { logout } from "../api/auth";
import { RENEWALS_PATH } from "../constants";
import {
  Avatar,
  Button,
  ErrorState,
  Modal,
  PageHeader,
  PageShell,
  Spinner,
  StatusBadge,
} from "../components/ui";
import styles from "../components/ui.module.css";

export function AccountPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<MemberSelf | null>(null);
  const [membership, setMembership] = useState<MembershipSelf | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    Promise.all([fetchOwnProfile(), fetchOwnMembership()])
      .then(([profileData, membershipData]) => {
        setProfile(profileData);
        setMembership(membershipData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load account.");
      });
  }, []);

  async function confirmLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  }

  if (error && !profile) {
    return (
      <PageShell>
        <ErrorState message={error} />
      </PageShell>
    );
  }

  if (!profile || !membership) {
    return (
      <PageShell>
        <Spinner />
      </PageShell>
    );
  }

  const programLine = [profile.degree_program, profile.year_level ? `Year ${profile.year_level}` : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <PageShell>
      <PageHeader title="My Account" />

      <section className={`${styles.card} mb-8`}>
        <div className={styles.accountHeader}>
          <Avatar name={profile.full_name} size="lg" />
          <div className={styles.accountHeaderText}>
            <h2 className="type-object-title m-0 text-xl text-circuit-navy">{profile.full_name}</h2>
            <p className="m-0 text-sm text-text-secondary">Member</p>
            {programLine ? <p className="m-0 mt-1 text-sm text-text-secondary">{programLine}</p> : null}
          </div>
        </div>
      </section>

      <section className={`${styles.card} mb-8`}>
        <h3 className={styles.accountSectionTitle}>Membership</h3>
        <dl className={styles.metaGrid}>
          <div>
            <dt>Academic year</dt>
            <dd>{membership.academic_year_label}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={membership.membership_status} />
            </dd>
          </div>
        </dl>
        {membership.needs_renewal ? (
          <p className={styles.renewalLinkWrap}>
            <Link to={RENEWALS_PATH}>View membership</Link>
          </p>
        ) : null}
      </section>

      <section className={`${styles.card} mb-8`}>
        <h3 className={styles.accountSectionTitle}>Account information</h3>
        <dl className={styles.metaGrid}>
          <div>
            <dt>Full name</dt>
            <dd>{profile.full_name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{profile.email}</dd>
          </div>
          <div>
            <dt>Degree program</dt>
            <dd>{profile.degree_program ?? "—"}</dd>
          </div>
          <div>
            <dt>Year level</dt>
            <dd>{profile.year_level ?? "—"}</dd>
          </div>
          <div>
            <dt>Batch</dt>
            <dd>{profile.batch ?? "—"}</dd>
          </div>
          <div>
            <dt>Contact number</dt>
            <dd>{profile.contact_number ?? "—"}</dd>
          </div>
          <div>
            <dt>Student number</dt>
            <dd>{profile.student_number ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className={styles.card}>
        <h3 className={styles.accountSectionTitle}>Security</h3>
        <p className={styles.securityNote}>
          Sign-in uses your password and a one-time email code. Profile editing is not available yet.
        </p>
        <div className={styles.accountActions}>
          <Button variant="danger" onClick={() => setLogoutOpen(true)} aria-label="Log out of account">
            Log Out
          </Button>
        </div>
        {error ? <ErrorState message={error} /> : null}
      </section>

      <Modal
        open={logoutOpen}
        title="Log out of UP Circuit?"
        onClose={() => setLogoutOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLogoutOpen(false)} disabled={loggingOut}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void confirmLogout()} disabled={loggingOut}>
              {loggingOut ? "Logging out…" : "Log Out"}
            </Button>
          </>
        }
      >
        <p>You will need to sign in again to access the portal.</p>
      </Modal>
    </PageShell>
  );
}
