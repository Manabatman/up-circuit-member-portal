import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";

import { fetchCurrentAcademicYear, type AcademicYear } from "../api/academicYear";
import type { MeResponse } from "../api/auth";
import { fetchOwnMembership, type MembershipSelf } from "../api/members";
import { RENEWAL_URL } from "../constants";
import { Icon } from "../components/Icon";
import {
  ErrorState,
  MembershipPill,
  PageHeader,
  PageShell,
  PrimaryExternalButton,
} from "../components/ui";
import {
  membershipExplanation,
  membershipHeadline,
  showMembershipPortalAction,
} from "../utils/membershipCopy";
import styles from "../components/ui.module.css";

function heroCardClass(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "RENEWED") return styles.membershipHeroCard_renewed;
  if (normalized === "PENDING") return styles.membershipHeroCard_pending;
  return styles.membershipHeroCard_notRenewed;
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
  const status = membership?.membership_status ?? me.membership_status;
  const explanation = membershipExplanation(status, ayLabel === "—" ? year?.label : ayLabel);

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
          {membershipHeadline(status)}
        </h2>
        <p className="m-0 text-sm text-text-secondary">{explanation}</p>
        {showMembershipPortalAction(status) ? (
          <PrimaryExternalButton href={RENEWAL_URL}>Open membership portal</PrimaryExternalButton>
        ) : null}
      </section>

      {error ? <ErrorState message={error} /> : null}
    </PageShell>
  );
}

export function RenewalsPage() {
  const me = useOutletContext<MeResponse>();
  return <RenewalsPageContent me={me} />;
}
