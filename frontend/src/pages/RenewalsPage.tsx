import { useOutletContext } from "react-router-dom";
import { useEffect, useState } from "react";

import { fetchCurrentAcademicYear, type AcademicYear } from "../api/academicYear";
import type { MeResponse } from "../api/auth";
import { RENEWAL_URL } from "../constants";
import {
  ErrorState,
  PageHeader,
  PageShell,
  PrimaryExternalButton,
  StatusBadge,
} from "../components/ui";
import styles from "../components/ui.module.css";

export function RenewalsPageContent({ me }: { me: MeResponse }) {
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [error, setError] = useState<string | null>(null);

  const needsRenewal =
    me.membership_status === "NOT_RENEWED" || me.membership_status === "PENDING";

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then(setYear)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load academic year.");
      });
  }, []);

  return (
    <PageShell>
      <PageHeader title="Membership" />

      <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
        <StatusBadge status={me.membership_status} />
        {year ? <span>Academic year {year.label}</span> : null}
      </div>

      {needsRenewal ? (
        <section className={styles.renewalsSection}>
          <p className={styles.renewalsBody}>
            Complete renewal on the official UP Circuit Membership Portal.
          </p>
          <p className={styles.renewalsNote}>
            Renewals are processed on membership.upcircuit.org. Return here after your status is
            updated.
          </p>
          <PrimaryExternalButton href={RENEWAL_URL}>
            Open Membership Portal
          </PrimaryExternalButton>
        </section>
      ) : (
        <section className={styles.renewalsSection}>
          <p className={styles.renewalsBody}>
            {year
              ? `You're renewed for AY ${year.label}.`
              : "Your membership is renewed for the current academic year."}
          </p>
          <p className={styles.renewalsBody}>
            Manage your membership through the official UP Circuit Membership Portal.
          </p>
          <PrimaryExternalButton href={RENEWAL_URL}>
            Open Membership Portal
          </PrimaryExternalButton>
        </section>
      )}

      {error ? <ErrorState message={error} /> : null}
    </PageShell>
  );
}

export function RenewalsPage() {
  const me = useOutletContext<MeResponse>();
  return <RenewalsPageContent me={me} />;
}
