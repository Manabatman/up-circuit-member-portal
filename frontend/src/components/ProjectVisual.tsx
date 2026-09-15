import { useState } from "react";

import {
  getProjectVisual,
  type ProjectPlaceholderVariant,
} from "../content/projectVisuals";

type Props = {
  projectId: string;
  variant?: "featured" | "card" | "thumb";
};

const PLACEHOLDER_GRADIENT: Record<ProjectPlaceholderVariant, string> = {
  squeeeze: "from-circuit-navy via-bright-blue to-cyan",
  interackt: "from-indigo via-circuit-blue to-bright-blue",
  ewaste: "from-circuit-blue via-indigo to-circuit-navy",
};

function sizeClass(variant: NonNullable<Props["variant"]>): string {
  if (variant === "featured") return "aspect-[21/9] min-h-[10rem] w-full sm:min-h-[12rem]";
  if (variant === "thumb") return "h-full min-h-[5.5rem] w-full";
  return "aspect-[16/10] w-full";
}

export function ProjectPlaceholder({
  variant,
  alt,
  size = "card",
  quiet = false,
}: {
  variant: ProjectPlaceholderVariant;
  alt: string;
  size?: "featured" | "card" | "thumb";
  quiet?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${PLACEHOLDER_GRADIENT[variant]} ${sizeClass(size)} ${quiet ? "opacity-80" : ""}`}
      role="img"
      aria-label={alt}
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_35%,rgba(11,13,29,0.4)_100%)]" />
      {size !== "thumb" ? (
        <span className="absolute bottom-3 left-3 text-[0.625rem] font-medium tracking-wide text-white/65">
          {quiet ? "Coming soon" : "Circuit project"}
        </span>
      ) : null}
    </div>
  );
}

export function ProjectVisual({ projectId, variant = "card" }: Props) {
  const visual = getProjectVisual(projectId);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(visual.imageSrc) && !imageFailed;

  if (showImage) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${sizeClass(variant)}`}>
        <img
          src={visual.imageSrc}
          alt={visual.alt}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-circuit-navy/50 via-transparent to-transparent" />
      </div>
    );
  }

  return (
    <ProjectPlaceholder
      variant={visual.slug}
      alt={visual.alt}
      size={variant}
      quiet={variant === "card"}
    />
  );
}
