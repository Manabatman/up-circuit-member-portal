import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { logout, type MeResponse } from "../api/auth";
import {
  ADMIN_DIVISIONS_PATH,
  ADMIN_EVENTS_PATH,
  ADMIN_MEMBERS_PATH,
  ADMIN_OVERVIEW_PATH,
  ADMIN_RESOURCES_PATH,
  ROUTE_LABELS,
  SHOWCASE_ROUTES,
} from "../constants";
import { Icon, type IconName } from "./Icon";
import { ShareFeedback } from "./ShareFeedback";
import { Avatar, BrandMark, Button } from "./ui";

type Props = {
  me: MeResponse;
};

type NavItem = {
  key: string;
  path: string;
  label: string;
  icon: IconName;
};

const NAV_ORDER = [
  "dashboard",
  "academic_drive",
  "resources",
  "divisions",
  "member_directory",
  "account",
  "renew_membership",
] as const;

function sortNavItems<T extends { key: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ai = NAV_ORDER.indexOf(a.key as (typeof NAV_ORDER)[number]);
    const bi = NAV_ORDER.indexOf(b.key as (typeof NAV_ORDER)[number]);
    return (ai === -1 ? NAV_ORDER.length : ai) - (bi === -1 ? NAV_ORDER.length : bi);
  });
}

function buildRouteNavItems(me: MeResponse): NavItem[] {
  return sortNavItems(
    me.route_keys
      .filter((key) => key in ROUTE_LABELS && key !== "admin")
      .map((key) => ({ key, ...ROUTE_LABELS[key], icon: ROUTE_LABELS[key].icon as IconName })),
  );
}

function navLinkClass(isActive: boolean): string {
  const base =
    "group flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-[0.8125rem] font-medium leading-snug transition-colors no-underline hover:no-underline md:min-h-0 md:py-2";
  if (isActive) {
    return `${base} border-l-2 border-cyan bg-white/[0.04] pl-[calc(0.75rem-2px)] text-cyan [&_svg]:text-cyan`;
  }
  return `${base} text-[var(--text-on-dark-muted)] hover:bg-white/[0.04] hover:text-[var(--text-on-dark)] [&_svg]:text-[var(--text-on-dark-muted)] group-hover:[&_svg]:text-[var(--text-on-dark)]`;
}

function NavLinkItem({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === "/dashboard"}
      className={({ isActive }) => navLinkClass(isActive)}
      onClick={onNavigate}
    >
      <Icon name={item.icon} size={18} className="shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

export function AppLayout({ me }: Props) {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const routeNavItems = useMemo(() => buildRouteNavItems(me), [me.route_keys]);

  const homeItems = routeNavItems.filter((item) => item.key === "dashboard");
  const discoverItems = useMemo(() => {
    const items: NavItem[] = [
      { key: "calendar", ...SHOWCASE_ROUTES.calendar },
      ...routeNavItems.filter((item) =>
        ["academic_drive", "resources", "divisions", "member_directory"].includes(item.key),
      ),
      { key: "projects", ...SHOWCASE_ROUTES.projects },
    ];
    return items;
  }, [routeNavItems]);

  const personalItems = routeNavItems.filter((item) =>
    ["account", "renew_membership"].includes(item.key),
  );

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  const showAdminSection = me.permissions.includes("view_admin_dashboard");

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed.");
      setLoggingOut(false);
    }
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  function renderGroup(label: string, items: NavItem[]) {
    if (items.length === 0) return null;
    return (
      <div className="mb-3 flex flex-col gap-0.5">
        <span className="px-3 pb-1 pt-2 text-[0.6875rem] font-medium tracking-wide text-white/35">
          {label}
        </span>
        {items.map((item) => (
          <NavLinkItem key={item.key} item={item} onNavigate={closeMobile} />
        ))}
      </div>
    );
  }

  const sidebarClass = [
    "fixed left-0 z-[100] flex w-[min(var(--spacing-sidebar),85vw)] flex-col",
    "top-14 h-[calc(100dvh-3.5rem)] border-r border-white/[0.06] bg-[var(--sidebar-bg)] px-4 py-5",
    "transition-transform duration-200 ease-out max-md:overflow-hidden",
    "md:sticky md:top-0 md:h-screen md:w-[var(--sidebar-width)] md:translate-x-0 md:overflow-visible",
    mobileOpen ? "translate-x-0 max-md:pointer-events-auto" : "-translate-x-full max-md:pointer-events-none md:translate-x-0",
  ].join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-canvas md:grid md:min-h-screen md:grid-cols-[var(--sidebar-width)_1fr]">
      <header className="sticky top-0 z-[200] flex h-14 max-h-14 min-h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface px-4 md:hidden">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark size="md" />
          <strong className="truncate font-display text-base font-bold text-circuit-navy">UP Circuit</strong>
        </div>
        <button
          type="button"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-surface p-2 text-circuit-blue"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <Icon name={mobileOpen ? "close" : "menu"} size={22} />
        </button>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 top-14 z-[90] border-none bg-circuit-navy/50 md:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      ) : null}

      <aside className={sidebarClass}>
        <div className="mb-6 flex items-center gap-3 border-b border-white/[0.08] pb-5">
          <BrandMark size="lg" />
          <div className="min-w-0 leading-none">
            <strong className="font-display block text-[1.125rem] font-bold leading-none tracking-wide text-[var(--text-on-dark)]">
              UP Circuit
            </strong>
            <span className="mt-0.5 block text-[0.6875rem] font-normal leading-none text-[var(--text-on-dark-muted)] max-sm:hidden">
              Member Portal
            </span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Main navigation">
          {renderGroup("Home", homeItems)}
          {renderGroup("Discover", discoverItems)}

          {personalItems.length > 0 ? (
            <div className="mb-3 mt-1 flex flex-col gap-0.5 border-t border-white/[0.08] pt-3">
              {personalItems.map((item) => (
                <NavLinkItem key={item.key} item={item} onNavigate={closeMobile} />
              ))}
            </div>
          ) : null}

          {showAdminSection ? (
            <div className="mt-4 flex flex-col gap-0.5 border-t border-white/[0.08] pt-4">
              <span className="mb-2 px-3 text-[0.6875rem] font-medium tracking-wide text-white/35">
                Administration
              </span>
              <NavLink
                to={ADMIN_OVERVIEW_PATH}
                end
                className={({ isActive }) => navLinkClass(isActive)}
                onClick={closeMobile}
              >
                <Icon name="dashboard" size={18} className="shrink-0" />
                <span>Overview</span>
              </NavLink>
              {me.permissions.includes("manage_membership_status") ? (
                <NavLink
                  to={ADMIN_MEMBERS_PATH}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={closeMobile}
                >
                  <Icon name="directory" size={18} className="shrink-0" />
                  <span>Members</span>
                </NavLink>
              ) : null}
              {me.permissions.includes("manage_events") ? (
                <NavLink
                  to={ADMIN_EVENTS_PATH}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={closeMobile}
                >
                  <Icon name="calendar" size={18} className="shrink-0" />
                  <span>Events</span>
                </NavLink>
              ) : null}
              {me.permissions.includes("manage_academic_resources") ||
              me.permissions.includes("manage_organizational_resources") ? (
                <NavLink
                  to={ADMIN_RESOURCES_PATH}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={closeMobile}
                >
                  <Icon name="admin" size={18} className="shrink-0" />
                  <span>Content</span>
                </NavLink>
              ) : null}
              {me.permissions.includes("manage_organizational_resources") ? (
                <NavLink
                  to={ADMIN_DIVISIONS_PATH}
                  className={({ isActive }) => navLinkClass(isActive)}
                  onClick={closeMobile}
                >
                  <Icon name="divisions" size={18} className="shrink-0" />
                  <span>Divisions</span>
                </NavLink>
              ) : null}
            </div>
          ) : null}
        </nav>

        <div className="mt-auto flex flex-col gap-3 border-t border-white/[0.08] pt-4">
          <Button
            variant="ghost"
            className="!w-full !justify-start !border-transparent !bg-transparent !text-[var(--text-on-dark-muted)] hover:!bg-white/[0.04] hover:!text-[var(--text-on-dark)]"
            onClick={() => void onLogout()}
            disabled={loggingOut}
          >
            <Icon name="logout" size={18} />
            {loggingOut ? "Logging out…" : "Log Out"}
          </Button>
          <div className="flex items-center gap-3 px-3 py-2">
            <Avatar name={me.full_name} size="sm" />
            <div className="min-w-0">
              <span className="block truncate text-[0.8125rem] font-semibold text-[var(--text-on-dark)]">
                {me.full_name}
              </span>
              <span className="block truncate text-[0.6875rem] text-[var(--text-on-dark-muted)] max-sm:hidden">
                {me.email}
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-clip px-4 pb-8 pt-4 md:col-start-2 md:px-8 md:py-8">
        <Outlet context={me} />
        {error ? <p className="mt-4 text-sm text-[var(--danger-text)]">{error}</p> : null}
      </main>
      <ShareFeedback />
    </div>
  );
}
