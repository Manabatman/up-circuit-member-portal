import { useOutletContext } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { fetchCurrentAcademicYear, type AcademicYear } from "../api/academicYear";
import type { MeResponse } from "../api/auth";
import { fetchOwnMembership, type MembershipSelf } from "../api/members";
import { RENEWAL_URL } from "../constants";
import { Icon } from "../components/Icon";
import {
  ErrorState,
  Eyebrow,
  MembershipPill,
  PageHeader,
  PageShell,
  PrimaryExternalButton,
  PortalCard,
} from "../components/ui";
import { membershipStatusLabel } from "../components/ui";
import styles from "../components/ui.module.css";

function heroCardClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "RENEWED") return styles.membershipHeroCard_renewed;
  if (normalized === "PENDING") return styles.membershipHeroCard_pending;
  return styles.membershipHeroCard_notRenewed;
}

function heroHeadline(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "RENEWED") return "You're renewed for this academic year.";
  if (normalized === "PENDING") return "Your renewal is being processed.";
  return "Renew your membership to keep portal access.";
}

export function RenewalsPageContent({ me }: { me: MeResponse }) {
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [membership, setMembership] = useState<MembershipSelf | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then(setYear)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load academic year.");
      });
    fetchOwnMembership()
      .then(setMembership)
      .catch(() => undefined);
  }, []);

  const ayLabel = membership?.academic_year_label ?? year?.label ?? "—";
  const status = me.membership_status;

  const renewalDetail = useMemo(() => {
    if (!membership?.renewed_at) return null;
    const date = new Date(membership.renewed_at);
    if (Number.isNaN(date.getTime())) return membership.renewed_at;
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }, [membership]);

  const showRenewalStat = Boolean(membership?.renewed_at || membership?.needs_renewal);

  return (
    <PageShell>
      <PageHeader
        kicker="MEMBERSHIP"
        title="Membership"
        subtitle="Status and renewal for the current academic year."
      />

      <div className={styles.membershipPageHead}>
        <MembershipPill status={status} />
        {year ? <span className="text-sm text-text-secondary">AY {year.label}</span> : null}
      </div>

      <section
        className={`${styles.membershipHeroCard} ${heroCardClass(status)}`}
        aria-labelledby="membership-status-heading"
      >
        <Icon name="renew" size={32} className="text-bright-blue" />
        <h2 id="membership-status-heading" className={styles.membershipHeroHeadline}>
          {heroHeadline(status)}
        </h2>
        <hr className={styles.membershipHeroDivider} />
        <div className={styles.membershipHeroMetaGrid}>
          <div>
            <p className={styles.membershipHeroMetaLabel}>ACADEMIC YEAR</p>
            <p className={styles.membershipHeroMetaValue}>{ayLabel}</p>
          </div>
          <div>
            <p className={styles.membershipHeroMetaLabel}>STATUS</p>
            <p className={styles.membershipHeroMetaValue}>
              {membershipStatusLabel(status)}
            </p>
          </div>
        </div>
        <PrimaryExternalButton href={RENEWAL_URL}>Open portal</PrimaryExternalButton>
      </section>

      <Eyebrow>DETAILS</Eyebrow>
      <h2 className={styles.dashboardSectionTitle}>Membership Details</h2>
      <div className={styles.membershipStatGrid}>
        <div className={styles.membershipStatCard}>
          <p className={styles.membershipStatLabel}>ACADEMIC YEAR</p>
          <p className={styles.membershipStatValue}>{ayLabel}</p>
        </div>
        <div className={styles.membershipStatCard}>
          <p className={styles.membershipStatLabel}>STATUS</p>
          <p className={styles.membershipStatValue}>{membershipStatusLabel(status)}</p>
        </div>
        {showRenewalStat && renewalDetail ? (
          <div className={styles.membershipStatCard}>
            <p className={styles.membershipStatLabel}>RENEWAL</p>
            <p className={styles.membershipStatValue}>{renewalDetail}</p>
          </div>
        ) : null}
        {showRenewalStat && membership?.needs_renewal ? (
          <div className={styles.membershipStatCard}>
            <p className={styles.membershipStatLabel}>ACTION</p>
            <p className={styles.membershipStatValue}>Renewal required</p>
          </div>
        ) : null}
      </div>

      {status !== "RENEWED" ? (
        <PortalCard>
          <p className="m-0 text-sm text-text-secondary">
            Complete renewal on the official UP Circuit Membership Portal, then return here once
            your status updates.
          </p>
          <div className="mt-4">
            <PrimaryExternalButton href={RENEWAL_URL}>Open Membership Portal</PrimaryExternalButton>
          </div>
        </PortalCard>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
    </PageShell>
  );
}

export function RenewalsPage() {
  const me = useOutletContext<MeResponse>();
  return <RenewalsPageContent me={me} />;
}
