import { Link, useOutletContext } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { fetchCurrentAcademicYear, type AcademicYear } from "../api/academicYear";
import type { MeResponse } from "../api/auth";
import { fetchEvents, type PortalEvent } from "../api/events";
import { fetchOwnMembership, fetchOwnProfile, type MembershipSelf, type MemberSelf } from "../api/members";
import { fetchResources, type Resource } from "../api/resources";
import { RENEWAL_URL, RENEWALS_PATH, SHOWCASE_ROUTES } from "../constants";
import {
  ErrorState,
  Eyebrow,
  EventDateBlock,
  MembershipPill,
  OutlinedExternalButton,
  PageShell,
  PortalCard,
  QuickAccessCard,
} from "../components/ui";
import {
  endOfWeekIso,
  formatDashboardDateEyebrow,
  formatEventRowMeta,
  upcomingEventsFromToday,
} from "../utils/eventDates";
import { resolvePortalLinks } from "../utils/portalLinks";
import styles from "../components/ui.module.css";
import { Icon } from "../components/Icon";

function membershipHeadline(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "RENEWED") return "You're all set for this academic year.";
  if (normalized === "PENDING") return "Your renewal is being reviewed.";
  return "Renew your membership for this academic year.";
}

function membershipBody(membership: MembershipSelf | null, year: AcademicYear | null): string {
  const label = membership?.academic_year_label ?? year?.label;
  const normalized = (membership?.membership_status ?? "").toUpperCase();
  if (normalized === "RENEWED") {
    return `Your membership is active for ${label ?? "the current academic year"}. Details and updates are handled in the official membership portal.`;
  }
  if (normalized === "PENDING") {
    return "We'll update your portal access once your renewal is confirmed in the official membership portal.";
  }
  return "Complete renewal in the official membership portal to restore full member access for this academic year.";
}

export function DashboardPage() {
  const me = useOutletContext<MeResponse>();
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [, setProfile] = useState<MemberSelf | null>(null);
  const [membership, setMembership] = useState<MembershipSelf | null>(null);
  const [academicResources, setAcademicResources] = useState<Resource[]>([]);
  const [orgResources, setOrgResources] = useState<Resource[]>([]);
  const [weekEvents, setWeekEvents] = useState<PortalEvent[]>([]);
  const [fallbackEvents, setFallbackEvents] = useState<PortalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date(), []);
  const dateEyebrow = useMemo(() => formatDashboardDateEyebrow(today), [today]);
  const firstName = me.full_name.trim().split(/\s+/)[0] ?? me.full_name;

  useEffect(() => {
    fetchCurrentAcademicYear()
      .then(setYear)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not load academic year.");
      });
    fetchOwnProfile().then(setProfile).catch(() => undefined);
    fetchOwnMembership().then(setMembership).catch(() => undefined);
    fetchResources("academic")
      .then((data) => setAcademicResources(data.items))
      .catch(() => undefined);
    fetchResources("organizational")
      .then((data) => setOrgResources(data.items))
      .catch(() => undefined);

    const todayIso = new Date().toISOString().slice(0, 10);
    const weekEnd = endOfWeekIso(new Date());
    fetchEvents({ from_date: todayIso, to_date: weekEnd })
      .then((data) => setWeekEvents(data.items))
      .catch(() => undefined);
    fetchEvents({ from_date: todayIso })
      .then((data) => setFallbackEvents(upcomingEventsFromToday(data.items, 5)))
      .catch(() => undefined);
  }, []);

  const portalLinks = useMemo(
    () => resolvePortalLinks(academicResources, orgResources),
    [academicResources, orgResources],
  );

  const displayEvents = weekEvents.length > 0 ? weekEvents : fallbackEvents;
  const sortedEvents = useMemo(
    () =>
      [...displayEvents].sort((a, b) => {
        const cmp = a.starts_on.localeCompare(b.starts_on);
        if (cmp !== 0) return cmp;
        return (a.start_time ?? "").localeCompare(b.start_time ?? "");
      }),
    [displayEvents],
  );

  const membershipStatus = membership?.membership_status ?? me.membership_status;
  const academicYearLabel =
    membership?.academic_year_label ?? (year ? `AY ${year.label}` : null);

  return (
    <PageShell>
      <div className={styles.dashboardWelcomeRow}>
        <div className={styles.dashboardWelcomeMain}>
          <Eyebrow>{dateEyebrow}</Eyebrow>
          <h1 className={styles.dashboardWelcomeTitle}>Welcome back, {firstName}.</h1>
          <p className={styles.dashboardWelcomeTagline}>
            Everything you need from Circuit, in one place.
          </p>
        </div>
        <div className={styles.dashboardMembershipMini}>
          <div className={styles.dashboardMembershipMiniHead}>
            <span>Membership</span>
            <MembershipPill status={membershipStatus} />
          </div>
          {academicYearLabel ? (
            <p className={styles.dashboardMembershipMiniYear}>{academicYearLabel}</p>
          ) : null}
        </div>
      </div>

      <section className="mb-8">
        <div className={styles.dashboardSectionHead}>
          <div>
            <Eyebrow>START HERE</Eyebrow>
            <h2 className={styles.dashboardSectionTitle}>Where do you need to go?</h2>
          </div>
          <p className={styles.dashboardSectionHint}>Links open in their official workspace</p>
        </div>
        <div className={styles.quickAccessGrid}>
          <QuickAccessCard
            title="Academic Drive"
            description="Reviewers, samplex, and course materials"
            href={portalLinks.academicDrive}
            icon="academic"
          />
          <QuickAccessCard
            title="Circuit Constitution"
            description="The organization's governing document"
            href={portalLinks.constitution}
            icon="doc"
          />
          <QuickAccessCard
            title="Division Hubs"
            description="Files, trackers, and division workspaces"
            href={portalLinks.divisionHubs}
            icon="grid"
          />
        </div>
      </section>

      <div className={styles.dashboardLowerGrid}>
        <PortalCard>
          <div className={styles.dashboardCardHead}>
            <div>
              <Eyebrow>COMING UP</Eyebrow>
              <h2 className={styles.dashboardCardTitle}>This week</h2>
            </div>
            <Link to={SHOWCASE_ROUTES.calendar.path} className={styles.dashboardCardLink}>
              View calendar →
            </Link>
          </div>
          {sortedEvents.length === 0 ? (
            <div>
              <p className="m-0 text-sm font-medium text-circuit-navy">No upcoming events</p>
              <p className="mt-1 text-sm text-text-secondary">You&apos;re all caught up for now.</p>
              <p className="mt-3 text-sm">
                <Link
                  to={SHOWCASE_ROUTES.calendar.path}
                  className="font-medium text-bright-blue no-underline hover:underline"
                >
                  Open calendar
                </Link>
              </p>
            </div>
          ) : (
            <ul className={styles.dashboardEventList}>
              {sortedEvents.map((event) => (
                <li key={event.id} className={styles.dashboardEventRow}>
                  <EventDateBlock isoDate={event.starts_on} variant="dashboard" />
                  <div className={styles.dashboardEventRowBody}>
                    <Link
                      to={`/calendar/${event.id}`}
                      className={`${styles.dashboardEventTitleLink} ${styles.dashboardEventTitle}`}
                    >
                      {event.title}
                    </Link>
                    <p className={styles.dashboardEventMeta}>{formatEventRowMeta(event)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </PortalCard>

        <PortalCard>
          <div className={styles.membershipInfoCardHead}>
            <span className={styles.membershipInfoIcon} aria-hidden>
              <Icon name="account" size={20} />
            </span>
            <MembershipPill status={membershipStatus} />
          </div>
          <Eyebrow>YOUR MEMBERSHIP</Eyebrow>
          <h2 className={styles.membershipInfoHeadline}>
            {membershipHeadline(membershipStatus)}
          </h2>
          <p className={styles.membershipInfoBody}>{membershipBody(membership, year)}</p>
          {membershipStatus.toUpperCase() !== "RENEWED" ? (
            <p className="mb-4 text-sm">
              <Link
                to={RENEWALS_PATH}
                className="font-medium text-bright-blue no-underline hover:underline"
              >
                Renew membership for this academic year
              </Link>
            </p>
          ) : null}
          <OutlinedExternalButton href={RENEWAL_URL}>Open membership portal</OutlinedExternalButton>
        </PortalCard>
      </div>

      {error ? <ErrorState message={error} /> : null}
    </PageShell>
  );
}
