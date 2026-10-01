import { Link, useOutletContext } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { fetchCurrentAcademicYear, type AcademicYear } from "../api/academicYear";
import type { MeResponse } from "../api/auth";
import { fetchEvents, type PortalEvent } from "../api/events";
import { fetchOwnProfile, type MemberSelf } from "../api/members";
import { fetchResources, type Resource } from "../api/resources";
import {
  RENEWALS_PATH,
  ROUTE_LABELS,
  SHOWCASE_ROUTES,
  VERIFIED_RESOURCE_TITLES,
} from "../constants";
import {
  ErrorState,
  EventCardLink,
  PageShell,
  PrimaryExternalButton,
  SectionHeader,
  StatusBadge,
} from "../components/ui";
import { formatEventPeriod, mapEventCategoryForCard } from "../utils/eventDates";
import styles from "../components/ui.module.css";

const QUICK_ACTIONS = [
  { key: "academic_drive", label: "Academic Drive" },
  { key: "renew_membership", label: "Renew Membership" },
  { key: "resources", label: "Resources" },
  { key: "projects", label: "Flagship Events", path: SHOWCASE_ROUTES.projects.path },
] as const;

export function DashboardPage() {
  const me = useOutletContext<MeResponse>();
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [profile, setProfile] = useState<MemberSelf | null>(null);
  const [orgResources, setOrgResources] = useState<Resource[]>([]);
  const [upcoming, setUpcoming] = useState<PortalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const needsRenewal =
    me.membership_status === "NOT_RENEWED" || me.membership_status === "PENDING";

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then(setYear)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load academic year.");
      });
    fetchOwnProfile().then(setProfile).catch(() => undefined);
    fetchResources("organizational")
      .then((data) => setOrgResources(data.items))
      .catch(() => undefined);
    const today = new Date().toISOString().slice(0, 10);
    fetchEvents({ from_date: today })
      .then((data) => setUpcoming(data.items.slice(0, 3)))
      .catch(() => undefined);
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

  const actions = QUICK_ACTIONS.filter((action) =>
    action.key === "projects" ? true : me.route_keys.includes(action.key),
  );

  return (
    <PageShell>
      <header className="mb-8">
        <p className="mb-2 text-xs font-medium tracking-wide text-text-secondary">Home</p>
        <h1 className="type-page-title m-0 text-[2rem] leading-tight text-circuit-navy">
          Welcome back, {me.full_name.split(" ")[0]}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-secondary">
          <StatusBadge status={me.membership_status} />
          {year ? <span>Academic year {year.label}</span> : null}
          {programLine ? <span>{programLine}</span> : null}
        </div>
        {needsRenewal ? (
          <p className="mt-3 text-sm">
            <Link
              to={RENEWALS_PATH}
              className="font-medium text-bright-blue no-underline hover:underline"
            >
              Renew membership for this academic year
            </Link>
          </p>
        ) : null}
      </header>

      <section className="mb-10">
        <SectionHeader title="Quick actions" />
        <div className={styles.dashboardActionGrid}>
          {actions.map((action) => {
            const path =
              action.key === "projects"
                ? SHOWCASE_ROUTES.projects.path
                : (ROUTE_LABELS[action.key]?.path ?? "/dashboard");
            const label =
              action.key === "projects"
                ? action.label
                : (ROUTE_LABELS[action.key]?.label ?? action.label);
            return (
              <Link key={action.key} to={path} className={styles.dashboardActionCard}>
                {label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-10">
        <SectionHeader title="Upcoming" />
        {upcoming.length === 0 ? (
          <p className="text-sm text-text-secondary">No upcoming events on the calendar yet.</p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventCardLink
                  to={`/calendar/${event.id}`}
                  title={event.title}
                  category={mapEventCategoryForCard(event.category)}
                  dateLabel={formatEventPeriod(event)}
                />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm">
          <Link
            to={SHOWCASE_ROUTES.calendar.path}
            className="font-medium text-bright-blue no-underline hover:underline"
          >
            View calendar
          </Link>
        </p>
      </section>

      {constitution ? (
        <section>
          <SectionHeader title="Quick access" />
          <PrimaryExternalButton href={constitution.url}>{constitution.title}</PrimaryExternalButton>
        </section>
      ) : null}

      {error ? <ErrorState message={error} /> : null}
    </PageShell>
  );
}
