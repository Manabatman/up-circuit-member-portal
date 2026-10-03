import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { CIRCUIT_LOGO_PATH, RENEWALS_PATH } from "../constants";
import type { PortalEvent } from "../api/events";
import {
  eventCategoryCssModuleKey,
  resolveEventCategoryDisplay,
} from "../utils/eventCategory";
import { formatResourceType, opensInLabel, resourceTypeIcon } from "../utils/resourceType";
import type { DivisionPlaceholderVariant } from "../content/divisionVisuals";
import type { CalendarEventCategory } from "../demo/calendar";
import { DivisionPlaceholder, DivisionVisual, shortDivisionName } from "./DivisionVisual";
import { Icon, type IconName } from "./Icon";
import { ProjectVisual } from "./ProjectVisual";
import styles from "./ui.module.css";

export function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className={styles.spinnerWrap} role="status" aria-live="polite">
      <div className={styles.spinnerRing} aria-hidden />
      <span className={styles.spinnerLabel}>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className={styles.errorState} role="alert">
      <p>{message}</p>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.emptyState}>
      {title ? <h3 className={styles.emptyStateTitle}>{title}</h3> : null}
      <p>{message}</p>
      {action ? <div className={styles.emptyStateAction}>{action}</div> : null}
    </div>
  );
}

export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-[var(--content-max)] ${className ?? ""}`.trim()}>
      {children}
    </div>
  );
}

export function SectionHeader({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <header className="mb-4 mt-12 border-t border-border/60 pt-8 first:mt-0 first:border-t-0 first:pt-0">
      {kicker ? (
        <p className="mb-1 text-xs font-medium tracking-wide text-text-secondary">{kicker}</p>
      ) : null}
      <h2 className="type-section-title m-0 text-base text-circuit-navy">{title}</h2>
      {subtitle ? <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">{subtitle}</p> : null}
    </header>
  );
}

export function EventCardLink({
  to,
  title,
  category,
  dateLabel,
}: {
  to: string;
  title: string;
  category: CalendarEventCategory;
  dateLabel: string;
}) {
  const accentClass =
    category === "academic"
      ? styles.calendarAccent_academic
      : category === "org"
        ? styles.calendarAccent_org
        : styles.calendarAccent_project;

  return (
    <Link
      to={to}
      className={`${styles.eventCardLink} ${accentClass} group no-underline hover:no-underline`}
    >
      <h3 className="type-object-title m-0 text-[0.9375rem] text-circuit-blue group-hover:text-bright-blue">
        {title}
      </h3>
      <p className="m-0 text-xs leading-relaxed text-text-secondary">{dateLabel}</p>
    </Link>
  );
}

export function DemoBanner({ children }: { children: ReactNode }) {
  return (
    <div className={styles.demoBanner} role="note">
      {children}
    </div>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="mb-8 text-sm text-[var(--demo-chip-text)]" role="note">
      {children}
    </p>
  );
}

export function ProjectCard({
  projectId,
  name,
  tagline,
  to,
  featured = false,
  comingSoon = false,
}: {
  projectId: string;
  name: string;
  tagline?: string;
  to?: string;
  featured?: boolean;
  comingSoon?: boolean;
}) {
  const body = (
    <>
      <ProjectVisual projectId={projectId} variant={featured ? "featured" : "card"} />
      <div className={`flex flex-col justify-center ${featured ? "gap-3 p-6 sm:p-8" : "gap-2 p-4"}`}>
        <h2
          className={`type-object-title m-0 text-circuit-blue ${featured ? "text-2xl" : "text-lg"} ${comingSoon ? "opacity-90" : ""}`}
        >
          {name}
        </h2>
        {tagline ? (
          <p className="m-0 text-sm leading-relaxed text-text-secondary">{tagline}</p>
        ) : null}
        {comingSoon ? (
          <span className="text-xs font-medium text-text-secondary">Coming soon</span>
        ) : to ? (
          <span className="text-sm font-medium text-bright-blue">
            {/^https?:\/\//i.test(to) ? "Open link" : "Open project"}
          </span>
        ) : null}
      </div>
    </>
  );

  const clickable = Boolean(to) && !comingSoon;
  const featuredClass =
    "group grid overflow-hidden rounded-xl border border-border/80 bg-surface no-underline transition-[border-color,box-shadow] hover:border-cyan/50 hover:shadow-[var(--shadow-card)] hover:no-underline md:grid-cols-[1.15fr_1fr]";
  const cardClass = clickable
    ? "group flex flex-col overflow-hidden rounded-xl border border-border/70 bg-surface no-underline transition-[border-color,box-shadow] hover:border-cyan/50 hover:shadow-[var(--shadow-card)] hover:no-underline"
    : `flex flex-col overflow-hidden rounded-xl border border-border/70 bg-surface ${comingSoon ? "opacity-90" : ""}`;
  const className = featured && clickable ? featuredClass : featured && !clickable
    ? "grid overflow-hidden rounded-xl border border-border/80 bg-surface md:grid-cols-[1.15fr_1fr]"
    : cardClass;

  if (clickable && to) {
    if (/^https?:\/\//i.test(to)) {
      return (
        <a href={to} target="_blank" rel="noreferrer" className={featured ? featuredClass : cardClass}>
          {body}
        </a>
      );
    }
    return (
      <Link to={to} className={featured ? featuredClass : cardClass}>
        {body}
      </Link>
    );
  }

  return <article className={className}>{body}</article>;
}

export function SampleChip({ label = "Sample" }: { label?: string }) {
  return <span className={styles.sampleChip}>{label}</span>;
}

export function ResourceRow({
  title,
  description,
  url,
  resourceType,
  onEdit,
}: {
  title: string;
  description?: string | null;
  url: string;
  resourceType: string;
  onEdit?: () => void;
}) {
  const iconName = resourceTypeIcon(resourceType);
  return (
    <li className={styles.resourceRow}>
      <span className={styles.resourceRowIcon} aria-hidden>
        <Icon name={iconName} size={20} />
      </span>
      <div className={styles.resourceRowBody}>
        <h3 className={styles.resourceRowTitle}>
          <ExternalLink href={url}>{title}</ExternalLink>
        </h3>
        {description ? <p className={styles.resourceRowDesc}>{description}</p> : null}
        <p className={styles.resourceRowMeta}>
          <span className={styles.resourceTypeChip}>{formatResourceType(resourceType)}</span>
          <span className={styles.resourceRowOpens}>{opensInLabel(resourceType)}</span>
          {onEdit ? (
            <button type="button" className={styles.resourceRowEdit} onClick={onEdit}>
              Edit
            </button>
          ) : null}
        </p>
      </div>
    </li>
  );
}

export function DivisionCardLink({
  to,
  divisionName,
  description,
  resourceCount,
  exploreLabel = "Explore division",
}: {
  to: string;
  divisionName: string;
  description?: string | null;
  resourceCount?: number;
  exploreLabel?: string;
}) {
  const displayName =
    divisionName === "Executive Board" ? divisionName : shortDivisionName(divisionName);
  return (
    <Link to={to} className={styles.divisionCardLink}>
      <DivisionVisual divisionName={divisionName} variant="card" />
      <div className={styles.divisionCardBody}>
        <h2 className={styles.divisionCardTitle}>{displayName}</h2>
        {description ? <p className={styles.divisionCardDesc}>{description}</p> : null}
        {resourceCount && resourceCount > 0 ? (
          <p className={styles.divisionCardMeta}>Resources available</p>
        ) : null}
        <span className={styles.divisionCardAction}>{exploreLabel}</span>
      </div>
    </Link>
  );
}

export function ExecutiveBoardCard({
  title,
  description,
  imageSrc,
  alt,
  placeholderVariant,
}: {
  title: string;
  description: string;
  imageSrc?: string;
  alt: string;
  placeholderVariant: DivisionPlaceholderVariant;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(imageSrc) && !imageFailed;

  return (
    <article className={styles.executiveBoardCard}>
      {showImage ? (
        <div className={styles.divisionCardMedia}>
          <img
            src={imageSrc}
            alt={alt}
            className={styles.divisionPhoto}
            onError={() => setImageFailed(true)}
          />
        </div>
      ) : (
        <DivisionPlaceholder
          variant={placeholderVariant}
          alt={alt}
          className={styles.divisionCardMedia}
        />
      )}
      <div className={styles.divisionCardBody}>
        <p className={styles.executiveBoardKicker}>Circuit leadership</p>
        <h2 className={styles.divisionCardTitle}>{title}</h2>
        <p className={styles.divisionCardDesc}>{description}</p>
      </div>
    </article>
  );
}

export function DivisionHero({
  divisionName,
  description,
}: {
  divisionName: string;
  description?: string | null;
}) {
  return (
    <header className={styles.divisionHeroBanner}>
      <DivisionVisual divisionName={divisionName} variant="hero" />
      <div className={styles.divisionHeroText}>
        <h1 className={styles.divisionHeroTitle}>{shortDivisionName(divisionName)}</h1>
        {description ? <p className={styles.divisionHeroDesc}>{description}</p> : null}
      </div>
    </header>
  );
}

export function SuccessBanner({ message }: { message: string }) {
  return (
    <div className={styles.successBanner} role="status">
      <p>{message}</p>
    </div>
  );
}

export function AccessDenied({
  title,
  message,
  showRenewalLink = false,
}: {
  title: string;
  message: string;
  showRenewalLink?: boolean;
}) {
  return (
    <div className={styles.accessDenied}>
      <h2>{title}</h2>
      <p>{message}</p>
      {showRenewalLink ? (
        <Link to={RENEWALS_PATH} className={styles.accessDeniedLink}>
          Renew membership for this academic year
        </Link>
      ) : null}
    </div>
  );
}

/** Member-facing labels — database enums stay NOT_RENEWED / PENDING / RENEWED. */
export function membershipStatusLabel(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "RENEWED") return "Renewed";
  if (normalized === "NOT_RENEWED") return "Renewal needed";
  if (normalized === "PENDING") return "Pending review";
  return status.replaceAll("_", " ");
}

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const className =
    normalized === "RENEWED"
      ? styles.badgeRenewed
      : normalized === "NOT_RENEWED"
        ? styles.badgeNotRenewed
        : styles.badgePending;
  return <span className={className}>{membershipStatusLabel(status)}</span>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={`${styles.card} ${className ?? ""}`.trim()}>{children}</section>;
}

export function PageHeader({
  title,
  subtitle,
  kicker,
  actions,
}: {
  title: string;
  subtitle?: string;
  kicker?: string;
  actions?: ReactNode;
}) {
  return (
    <header
      className={`${styles.pageHeader} mb-8 flex flex-wrap items-start justify-between gap-4 max-md:mb-5`}
    >
      <div className={styles.pageHeaderMain}>
        {kicker ? (
          <p className="mb-2 text-xs font-medium tracking-wide text-text-secondary">{kicker}</p>
        ) : null}
        <h1 className="type-page-title m-0 text-[1.875rem] leading-tight text-circuit-navy">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-text-secondary">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className={`shrink-0 ${styles.pageHeaderActions}`}>{actions}</div>
      ) : null}
    </header>
  );
}

export function PrimaryExternalButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${styles.btn} ${styles.btnPrimary} ${styles.primaryExternalBtn}`}
    >
      {children}
    </a>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "secondary",
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary"
      ? styles.btnPrimary
      : variant === "danger"
        ? styles.btnDanger
        : variant === "ghost"
          ? styles.btnGhost
          : styles.btnSecondary;
  return (
    <button type={type} className={`${styles.btn} ${variantClass} ${className ?? ""}`.trim()} {...props}>
      {children}
    </button>
  );
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`${styles.externalLink} ${className ?? ""}`.trim()}>
      <span>{children}</span>
      <Icon name="external" size={16} />
    </a>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={styles.searchWrap}>
      <Icon name="search" size={18} className={styles.searchIcon} />
      <input
        id={inputId}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.searchInput}
      />
    </div>
  );
}

export function FormField({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className={styles.formField}>
      <span className={styles.formLabel}>{label}</span>
      {children}
      {hint ? <span className={styles.formHint}>{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={styles.input} {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={styles.textarea} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={styles.select} {...props} />;
}

export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  dialogId = "modal-dialog",
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  dialogId?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = `${dialogId}-title`;

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      dialogRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="presentation">
      <div
        id={dialogId}
        ref={dialogRef}
        className={styles.modalDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.modalTitle}>
          {title}
        </h2>
        <div className={styles.modalBody}>{children}</div>
        {footer ? <div className={styles.modalFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
  const sizeClass =
    size === "sm" ? styles.avatarSm : size === "lg" ? styles.avatarLg : styles.avatarMd;
  return (
    <span className={`${styles.avatar} ${sizeClass}`} aria-hidden>
      {initials}
    </span>
  );
}

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" | "xl" }) {
  const [useFallback, setUseFallback] = useState(false);
  const sizeClass =
    size === "sm"
      ? styles.brandMarkSm
      : size === "lg"
        ? styles.brandMarkLg
        : size === "xl"
          ? styles.brandMarkXl
          : styles.brandMarkMd;

  if (useFallback) {
    return (
      <span
        className={`${styles.brandMark} ${styles.brandMarkFallback} ${sizeClass}`}
        aria-hidden
      >
        UC
      </span>
    );
  }

  return (
    <span className={`${styles.brandMark} ${sizeClass}`}>
      <img
        src={CIRCUIT_LOGO_PATH}
        alt="UP Circuit"
        className={styles.brandMarkImg}
        onError={() => setUseFallback(true)}
      />
    </span>
  );
}

export function SessionSplash() {
  return (
    <div className={styles.sessionSplash}>
      <BrandMark size="lg" />
      <Spinner label="Loading session…" />
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className={styles.eyebrow}>{children}</p>;
}

export function MembershipPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const className =
    normalized === "RENEWED"
      ? styles.membershipPillRenewed
      : normalized === "NOT_RENEWED"
        ? styles.membershipPillNotRenewed
        : styles.membershipPillPending;
  return (
    <span className={className}>
      <span className={styles.membershipPillDot} aria-hidden />
      {membershipStatusLabel(status).toUpperCase()}
    </span>
  );
}

export function OutlinedExternalButton({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`${styles.outlinedExternalBtn} ${className ?? ""}`.trim()}
    >
      <span>{children}</span>
      <Icon name="external" size={16} />
    </a>
  );
}

export function QuickAccessCard({
  title,
  description,
  href,
  icon,
  footerLabel = "GOOGLE DRIVE",
}: {
  title: string;
  description: string;
  href: string | null;
  icon: IconName;
  footerLabel?: string;
}) {
  const inner = (
    <>
      <div className={styles.quickAccessTop}>
        <span className={styles.quickAccessIconWrap} aria-hidden>
          <Icon name={icon} size={20} className={styles.quickAccessIcon} />
        </span>
        <span className={styles.quickAccessArrow} aria-hidden>
          <Icon name="arrowRight" size={18} />
        </span>
      </div>
      <h3 className={styles.quickAccessTitle}>{title}</h3>
      <p className={styles.quickAccessDesc}>{description}</p>
      {href ? (
        <span className={styles.quickAccessFooter}>
          {footerLabel}
          <Icon name="external" size={14} />
        </span>
      ) : (
        <span className={styles.quickAccessFooterMuted}>Link not configured yet</span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={`${styles.quickAccessCard} ${styles.quickAccessCardLink} no-underline hover:no-underline`}
      >
        {inner}
      </a>
    );
  }

  return <div className={`${styles.quickAccessCard} ${styles.quickAccessCardDisabled}`}>{inner}</div>;
}

export function EventDateBlock({
  isoDate,
  variant = "dashboard",
}: {
  isoDate: string;
  variant?: "dashboard" | "agenda";
}) {
  const d = new Date(`${isoDate}T12:00:00`);
  const day = d.getDate();
  const month = d.toLocaleDateString(undefined, { month: "short" }).toUpperCase();
  const weekday = d.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase();
  const blockClass =
    variant === "agenda" ? styles.eventDateBlockAgenda : styles.eventDateBlockDashboard;

  return (
    <div className={blockClass} aria-hidden>
      <span className={styles.eventDateBlockDay}>{day.toString().padStart(2, "0")}</span>
      <span className={styles.eventDateBlockSub}>
        {variant === "agenda" ? weekday : month}
      </span>
    </div>
  );
}

export function EventCategoryTag({ event }: { event: PortalEvent }) {
  const { label, styleKey } = resolveEventCategoryDisplay(event);
  const modKey = eventCategoryCssModuleKey(styleKey);
  const modClass = styles[modKey as keyof typeof styles] ?? styles.eventCat_community;
  return <span className={`${styles.eventCategoryTag} ${modClass}`}>{label}</span>;
}

export function PortalCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`${styles.portalCard} ${className ?? ""}`.trim()}>{children}</section>
  );
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className={styles.segmented} role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={value === opt.value ? styles.segmentActive : styles.segment}
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
