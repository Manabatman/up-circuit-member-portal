import type { Resource } from "../api/resources";
import {
  OFFICIAL_ACADEMIC_DRIVE_URL,
  OFFICIAL_CONSTITUTION_URL,
  VERIFIED_RESOURCE_TITLES,
} from "../constants";

export type PortalLinks = {
  academicDrive: string;
  constitution: string;
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
    academicDrive:
      urlByTitle(academicItems, VERIFIED_RESOURCE_TITLES.academicDrive) ??
      OFFICIAL_ACADEMIC_DRIVE_URL,
    constitution:
      urlByTitle(organizationalItems, VERIFIED_RESOURCE_TITLES.constitution) ??
      OFFICIAL_CONSTITUTION_URL,
    divisionHubs: urlByTitle(organizationalItems, VERIFIED_RESOURCE_TITLES.divisionHubs),
    googleCalendar: urlByTitle(organizationalItems, VERIFIED_RESOURCE_TITLES.googleCalendar),
  };
}
