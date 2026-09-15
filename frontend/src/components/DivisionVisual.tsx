import { useState } from "react";

import {
  getDivisionVisual,
  shortDivisionName,
  type DivisionPlaceholderVariant,
} from "../content/divisionVisuals";
import styles from "./ui.module.css";

type Props = {
  divisionName: string;
  variant?: "card" | "hero";
};

export function DivisionVisual({ divisionName, variant = "card" }: Props) {
  const visual = getDivisionVisual(divisionName);
  const [imageFailed, setImageFailed] = useState(false);
  /** Only load when officers add a real asset path in divisionVisuals.ts or public/divisions/. */
  const imageSrc = visual.imageSrc;
  const showImage = Boolean(imageSrc) && !imageFailed;

  const className =
    variant === "hero" ? styles.divisionHeroMedia : styles.divisionCardMedia;

  if (showImage) {
    return (
      <div className={className}>
        <img
          src={imageSrc}
          alt={visual.alt}
          className={styles.divisionPhoto}
          onError={() => setImageFailed(true)}
        />
      </div>
    );
  }

  return (
    <DivisionPlaceholder
      variant={visual.slug}
      alt={visual.alt}
      className={className}
    />
  );
}

export function DivisionPlaceholder({
  variant,
  alt,
  className,
}: {
  variant: DivisionPlaceholderVariant;
  alt: string;
  className?: string;
}) {
  return (
    <div
      className={`${styles.divisionPlaceholder} ${styles[`divisionPlaceholder_${variant}`]} ${className ?? ""}`.trim()}
      role="img"
      aria-label={alt}
    >
      <span className={styles.divisionPlaceholderCaption}>Division image coming soon</span>
    </div>
  );
}

export { shortDivisionName };
