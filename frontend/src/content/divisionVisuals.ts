/** Presentation config for standing division imagery — not demo data. */

export type DivisionPlaceholderVariant =
  | "academic-affairs"
  | "external-affairs"
  | "finance"
  | "internal-affairs"
  | "membership"
  | "publicity"
  | "executive-board";

export type DivisionVisual = {
  slug: DivisionPlaceholderVariant;
  /** Optional path under frontend/public/ — add real photos later. */
  imageSrc?: string;
  alt: string;
};

const HUB_VISUALS: Record<string, DivisionVisual> = {
  "Executive Board": {
    slug: "executive-board",
    imageSrc: "/executiveboard.png",
    alt: "Executive Board",
  },
  "Academic Affairs Division": {
    slug: "academic-affairs",
    imageSrc: "/acad-div.jpg",
    alt: "Academic Affairs Division",
  },
  "External Affairs Division": {
    slug: "external-affairs",
    alt: "External Affairs division image coming soon",
  },
  "Finance Division": {
    slug: "finance",
    alt: "Finance division image coming soon",
  },
  "Internal Affairs Division": {
    slug: "internal-affairs",
    alt: "Internal Affairs division image coming soon",
  },
  "Membership Division": {
    slug: "membership",
    alt: "Membership division image coming soon",
  },
  "Publicity Division": {
    slug: "publicity",
    alt: "Publicity division image coming soon",
  },
};

export function shortDivisionName(name: string): string {
  return name.replace(/ Division$/, "");
}

export function getDivisionVisual(divisionName: string): DivisionVisual {
  const known = HUB_VISUALS[divisionName];
  if (known) return known;
  return {
    slug: "internal-affairs",
    alt: `${shortDivisionName(divisionName)} division image coming soon`,
  };
}

export function divisionImagePath(slug: DivisionPlaceholderVariant): string {
  return `/divisions/${slug}.jpg`;
}

