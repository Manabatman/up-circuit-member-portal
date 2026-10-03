/**
 * Organizational Resources folder tiles.
 * A tile is a link only when an active database row matches, or the tile has its own fallback URL.
 */

import type { Resource } from "../api/resources";
import { OFFICIAL_CONSTITUTION_URL } from "../constants";

export type OrgFolderId = "documents" | "requests";

export type OrgResourceTile = {
  title: string;
  /** Match against Resource.title when present in DB */
  resourceTitle?: string;
  description?: string;
  /** Used when no active DB resource matches (not Academic Drive fallback). */
  fallbackUrl?: string;
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
    fallbackUrl: OFFICIAL_CONSTITUTION_URL,
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

export function resolveOrgTileUrl(tile: OrgResourceTile, resources: Resource[]): string | null {
  const matchTitle = tile.resourceTitle ?? tile.title;
  const row = resources.find((r) => r.title === matchTitle && r.is_active);
  if (row?.url) return row.url;
  if (tile.fallbackUrl) return tile.fallbackUrl;
  return null;
}

export const ORG_REQUEST_TILES: OrgResourceTile[] = [
  { title: "Double Division", description: "Request membership in two divisions" },
  { title: "Transfer Request", description: "Change your primary division" },
  { title: "Headships Form", description: "Apply for a division headship role" },
  { title: "Pub Request", resourceTitle: "Pub Request", description: "Publicity and communications" },
  { title: "Finance Request", description: "Reimbursements and org finances" },
  { title: "Venue Request", description: "Reserve rooms and venues" },
];
