import { Link, useOutletContext } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { fetchCurrentAcademicYear, type AcademicYear } from "../api/academicYear";
import type { MeResponse } from "../api/auth";
import { fetchOwnProfile, type MemberSelf } from "../api/members";
import { fetchResources, type Resource } from "../api/resources";
import { formatEventPeriod, getUpcomingDemoEvents } from "../demo/calendar";
import { RENEWALS_PATH, SHOWCASE_ROUTES, VERIFIED_RESOURCE_TITLES } from "../constants";
import { greetingForHour } from "../components/Icon";
import {
  ErrorState,
  EventCardLink,
  ExternalLink,
  PageShell,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import styles from "../components/ui.module.css";

export function DashboardPage() {
  const me = useOutletContext<MeResponse>();
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [profile, setProfile] = useState<MemberSelf | null>(null);
  const [orgResources, setOrgResources] = useState<Resource[]>([]);
  const [error, setError] = useState<string | null>(null);
  const greeting = greetingForHour(new Date().getHours());
  const upcoming = getUpcomingDemoEvents(3);

  const needsRenewal =
    me.membership_status === "NOT_RENEWED" || me.membership_status === "PENDING";

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then(setYear)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load academic year.");
      });
    fetchOwnProfile()
      .then(setProfile)
      .catch(() => {
        /* Profile optional on dashboard */
      });
  }, []);

  useEffect(() => {
    fetchResources("organizational")
      .then((data) => setOrgResources(data.items))
      .catch((err: unknown) => {
        setError((prev) => prev ?? (err instanceof Error ? err.message : "Could not load resources."));
      });
  }, []);

  const constitution = useMemo(
    () => orgResources.find((r) => r.title === VERIFIED_RESOURCE_TITLES.constitution),
    [orgResources],
  );

  const programLine =
    profile?.degree_program || profile?.year_level
      ? [profile.degree_program, profile.year_level ? `Year ${profile.year_level}` : null]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <PageShell>
      <header className="mb-10">
        <p className="mb-2 text-xs font-medium tracking-wide text-text-secondary">Home</p>
        <h1 className="type-page-title m-0 text-[2rem] leading-tight text-circuit-navy">
          {greeting}, {me.full_name.split(" ")[0]}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
          <StatusBadge status={me.membership_status} />
          {year ? <span>Academic year {year.label}</span> : null}
          {programLine ? <span>{programLine}</span> : null}
        </div>
        {needsRenewal ? (
          <p className="mt-3 text-sm">
            <Link to={RENEWALS_PATH} className="font-medium text-bright-blue no-underline hover:underline">
              Renew membership for this academic year
            </Link>
          </p>
        ) : null}
        <p className="mt-4 max-w-2xl text-text-secondary">
          Here&apos;s what&apos;s happening in Circuit.
        </p>
      </header>

      <section>
        <SectionHeader title="Upcoming" />
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {upcoming.map((event) => (
            <li key={event.id}>
              <EventCardLink
                to={`/calendar/${event.id}`}
                title={event.title}
                category={event.category}
                dateLabel={formatEventPeriod(event)}
              />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm">
          <Link to={SHOWCASE_ROUTES.calendar.path} className="font-medium text-bright-blue no-underline hover:underline">
            View calendar
          </Link>
        </p>
      </section>

      {constitution ? (
        <section>
          <SectionHeader title="Official documents" />
          <ul className="m-0 list-none space-y-2 p-0">
            <li>
              <ExternalLink href={constitution.url} className={styles.startHereLink}>
                {constitution.title}
              </ExternalLink>
            </li>
          </ul>
        </section>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
    </PageShell>
  );
}
