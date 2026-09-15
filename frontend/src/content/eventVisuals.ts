import type { CalendarEventCategory } from "../demo/calendar";

export type EventPlaceholderVariant = CalendarEventCategory;

export type EventVisual = {
  variant: EventPlaceholderVariant;
  /** Optional path under frontend/public/ */
  imageSrc?: string;
  alt: string;
};

const EVENT_VISUALS: Record<string, EventVisual> = {
  "demo-academic-drive": {
    variant: "academic",
    imageSrc: "/acad-div.jpg",
    alt: "Academic Drive review session",
  },
  "demo-academic-workshop": {
    variant: "academic",
    imageSrc: "/acad-div.jpg",
    alt: "Circuit academic workshop",
  },
  "demo-org-meeting": {
    variant: "org",
    imageSrc: "/executiveboard.png",
    alt: "Organizational planning meeting",
  },
  "demo-membership-window": {
    variant: "org",
    alt: "Membership renewal reminder",
  },
  "demo-squeeeze-prep": {
    variant: "project",
    alt: "SquEEEze preparation week",
  },
  "demo-squeeeze-finals": {
    variant: "project",
    alt: "SquEEEze finals day",
  },
  "demo-interackt": {
    variant: "project",
    alt: "InteraCKT outreach activity",
  },
  "demo-ewaste": {
    variant: "project",
    alt: "E-Waste collection drive",
  },
  "demo-escon": {
    variant: "project",
    alt: "ESCON planning checkpoint",
  },
};

export function getEventVisual(eventId: string, category: CalendarEventCategory): EventVisual {
  const known = EVENT_VISUALS[eventId];
  if (known) return known;
  return {
    variant: category,
    alt: "Event image",
  };
}
