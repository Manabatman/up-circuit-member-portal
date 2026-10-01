/** Official UP Circuit Membership Portal — renewal workflow stays external (NG2). */
export const RENEWAL_URL = "https://membership.upcircuit.org/";

/** First-time renewal / new members without a portal account (login page only). */
export const FIRST_TIME_RENEWAL_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScXEvv1TbG9upZ3ymzA-svMnZQ_Nb6VudR0YV9YWZOdp85TzA/viewform";

export const RENEWALS_PATH = "/renewals";

/** Resource titles used for dashboard Start Here (must match Admin rows). */
export const VERIFIED_RESOURCE_TITLES = {
  academicDrive: "Official Academic Drive",
  constitution: "UP Circuit Constitution",
} as const;

/** Official logo asset — drop `circuit-logo.png` in frontend/public/ */
export const CIRCUIT_LOGO_PATH = "/circuit-logo.png";

export const ROUTE_LABELS: Record<string, { path: string; label: string; icon: string }> = {
  dashboard: { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  resources: { path: "/resources", label: "Resources", icon: "resources" },
  academic_drive: { path: "/academic-drive", label: "Academic Drive", icon: "academic" },
  divisions: { path: "/divisions", label: "Divisions", icon: "divisions" },
  member_directory: { path: "/directory", label: "Members", icon: "directory" },
  account: { path: "/account", label: "My Account", icon: "account" },
  renew_membership: { path: RENEWALS_PATH, label: "Renew Membership", icon: "renew" },
  admin: { path: "/admin/resources", label: "Admin", icon: "admin" },
};

/** Frontend showcase routes — not in backend route permission map. */
export const SHOWCASE_ROUTES = {
  calendar: { path: "/calendar", label: "Calendar", icon: "calendar" as const },
  projects: { path: "/projects", label: "Flagship Events", icon: "projects" as const },
  squeeeze: { path: "/projects/squeeeze", label: "SquEEEze", icon: "projects" as const },
} as const;

export const ADMIN_OVERVIEW_PATH = "/admin";
export const ADMIN_MEMBERS_PATH = "/admin/members";
export const ADMIN_DIVISIONS_PATH = "/admin/divisions";
export const ADMIN_EVENTS_PATH = "/admin/events";
export const ADMIN_RESOURCES_PATH = "/admin/resources";
