import { useState } from "react";

import {
  getEventVisual,
  type EventPlaceholderVariant,
} from "../content/eventVisuals";
import type { CalendarEventCategory } from "../demo/calendar";

type Props = {
  eventId: string;
  category: CalendarEventCategory;
  variant?: "card" | "hero" | "thumb";
};

const PLACEHOLDER_GRADIENT: Record<EventPlaceholderVariant, string> = {
  academic: "from-circuit-blue via-bright-blue to-cyan",
  org: "from-indigo via-bright-blue to-circuit-blue",
  project: "from-circuit-navy via-circuit-blue to-indigo",
};

function cardSizeClass(variant: NonNullable<Props["variant"]>): string {
  if (variant === "hero") return "aspect-[21/9] min-h-[12rem] w-full";
  if (variant === "thumb") return "h-full min-h-[5.5rem] w-full";
  return "aspect-[16/10] w-full";
}

export function EventPlaceholder({
  variant,
  alt,
  size = "card",
}: {
  variant: EventPlaceholderVariant;
  alt: string;
  size?: "card" | "hero" | "thumb";
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${PLACEHOLDER_GRADIENT[variant]} ${cardSizeClass(size)}`}
      role="img"
      aria-label={alt}
    >
      <div className="absolute inset-0 bg-[linear-gradient(160deg,transparent_40%,rgba(11,13,29,0.35)_100%)]" />
      {size !== "thumb" ? (
        <span className="absolute bottom-3 left-3 text-[0.625rem] font-medium tracking-wide text-white/70">
          Sample event
        </span>
      ) : null}
    </div>
  );
}

export function EventVisual({ eventId, category, variant = "card" }: Props) {
  const visual = getEventVisual(eventId, category);
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(visual.imageSrc) && !imageFailed;

  if (showImage) {
    return (
      <div className={`relative overflow-hidden rounded-lg ${cardSizeClass(variant)}`}>
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

  return <EventPlaceholder variant={visual.variant} alt={visual.alt} size={variant} />;
}
