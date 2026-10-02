/**
 * Organizational Resources folder tiles.
 * URLs resolve at runtime: match active DB resource by exact title, else Official Academic Drive.
 */

export type OrgFolderId = "documents" | "requests";

export type OrgResourceTile = {
  title: string;
  /** Match against Resource.title when present in DB */
  resourceTitle?: string;
  description?: string;
};

export const ORG_FOLDERS: { id: OrgFolderId; label: string; description: string }[] = [
  {
    id: "documents",
    label: "Organizational resources",
    description: "Constitution, policies, and reference materials",
  },
  {
    id: "requests",
    label: "Requests",
    description: "Division, finance, venue, and publicity forms",
  },
];

export const ORG_DOCUMENT_TILES: OrgResourceTile[] = [
  {
    title: "Circuit Constitution",
    resourceTitle: "UP Circuit Constitution",
    description: "The organization's governing document",
  },
  {
    title: "Code of Discipline",
    description: "Member conduct and accountability",
  },
  {
    title: "CKT Trivia",
    description: "Circuit knowledge and traditions",
  },
  {
    title: "Safe Space",
    description: "Guidelines and support resources",
  },
];

import type { Resource } from "../api/resources";

export function resolveOrgTileUrl(
  tile: OrgResourceTile,
  resources: Resource[],
  academicDriveFallback: string | null,
): string | null {
  const matchTitle = tile.resourceTitle ?? tile.title;
  const row = resources.find((r) => r.title === matchTitle && r.is_active);
  return row?.url ?? academicDriveFallback;
}

export const ORG_REQUEST_TILES: OrgResourceTile[] = [
  { title: "Double Division", description: "Request membership in two divisions" },
  { title: "Transfer Request", description: "Change your primary division" },
  { title: "Headships Form", description: "Apply for a division headship role" },
  { title: "Pub Request", resourceTitle: "Pub Request", description: "Publicity and communications" },
  { title: "Finance Request", description: "Reimbursements and org finances" },
  { title: "Venue Request", description: "Reserve rooms and venues" },
];
