/** Member-facing copy for the three real membership states. Status values stay unchanged. */

export function membershipHeadline(status: string): string {
  const normalized = status.toUpperCase();
  if (normalized === "RENEWED") return "You're all set for this academic year.";
  if (normalized === "PENDING") return "Your account is waiting for officer approval.";
  return "Renew your membership for this academic year.";
}

export function membershipExplanation(
  status: string,
  yearLabel: string | null | undefined,
): string {
  const normalized = status.toUpperCase();
  const year = yearLabel?.trim() || "the current academic year";
  if (normalized === "RENEWED") {
    return `Your membership is active for ${year}. Member resources, including the Academic Drive, are available.`;
  }
  if (normalized === "PENDING") {
    return "An officer still needs to approve your account. Member-only resources stay unavailable until then. This is not a membership renewal.";
  }
  return `Complete renewal in the official membership portal to restore member access for ${year}.`;
}

/** Pending accounts are waiting on an officer, not the external renewal portal. */
export function showMembershipPortalAction(status: string): boolean {
  return status.toUpperCase() !== "PENDING";
}
