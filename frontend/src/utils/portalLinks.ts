import type { Resource } from "../api/resources";
import { VERIFIED_RESOURCE_TITLES } from "../constants";

export type PortalLinks = {
  academicDrive: string | null;
  constitution: string | null;
  divisionHubs: string | null;
  googleCalendar: string | null;
};

function urlByTitle(items: Resource[], title: string): string | null {
  const row = items.find((r) => r.title === title && r.is_active);
  return row?.url ?? null;
}

export function resolvePortalLinks(
  academicItems: Resource[],
  organizationalItems: Resource[],
): PortalLinks {
  return {
    academicDrive: urlByTitle(academicItems, VERIFIED_RESOURCE_TITLES.academicDrive),
    constitution: urlByTitle(organizationalItems, VERIFIED_RESOURCE_TITLES.constitution),
    divisionHubs: urlByTitle(organizationalItems, VERIFIED_RESOURCE_TITLES.divisionHubs),
    googleCalendar: urlByTitle(organizationalItems, VERIFIED_RESOURCE_TITLES.googleCalendar),
  };
}
