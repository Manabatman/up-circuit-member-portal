/** Presentation config for flagship project imagery — not demo data. */

export type ProjectPlaceholderVariant = "squeeeze" | "interackt" | "ewaste";

export type ProjectVisual = {
  slug: ProjectPlaceholderVariant;
  /** Optional path under frontend/public/ — add real photos later. */
  imageSrc?: string;
  alt: string;
};

const PROJECT_VISUALS: Record<string, ProjectVisual> = {
  squeeeze: {
    slug: "squeeeze",
    imageSrc: "/squeeze.jpg",
    alt: "SquEEEze quiz bee project",
  },
  interackt: {
    slug: "interackt",
    imageSrc: "/interackt.jpg",
    alt: "InteraCKT outreach project",
  },
  ewaste: {
    slug: "ewaste",
    imageSrc: "/tep.jpg",
    alt: "The E-Waste Project",
  },
};

export function getProjectVisual(projectId: string): ProjectVisual {
  const known = PROJECT_VISUALS[projectId];
  if (known) return known;
  return {
    slug: "squeeeze",
    alt: "Project image coming soon",
  };
}
