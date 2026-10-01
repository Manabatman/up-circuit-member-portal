import type { PortalEvent } from "../api/events";

export type EventCategoryStyleKey =
  | "organization"
  | "academic"
  | "community"
  | "membership"
  | "deadline"
  | "flagship";

export type EventCategoryDisplay = {
  label: string;
  styleKey: EventCategoryStyleKey;
};

export function resolveEventCategoryDisplay(event: PortalEvent): EventCategoryDisplay {
  if (event.is_flagship) {
    return { label: "Flagship", styleKey: "flagship" };
  }
  switch (event.category) {
    case "ORGANIZATION":
      return { label: "Organization", styleKey: "organization" };
    case "ACADEMIC":
      return { label: "Academic", styleKey: "academic" };
    case "EVENT":
      return { label: "Community", styleKey: "community" };
    case "MEMBERSHIP":
      return { label: "Membership", styleKey: "membership" };
    case "DEADLINE":
      return { label: "Deadline", styleKey: "deadline" };
    default:
      return { label: event.category.replaceAll("_", " "), styleKey: "community" };
  }
}

export function eventCategoryCssModuleKey(styleKey: EventCategoryStyleKey): string {
  return `eventCat_${styleKey}`;
}
