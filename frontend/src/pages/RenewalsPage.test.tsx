import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup } from "@testing-library/react";

import type { MeResponse } from "../api/auth";
import { RenewalsPageContent } from "./RenewalsPage";

vi.mock("../api/academicYear", () => ({
  fetchCurrentAcademicYear: vi.fn().mockResolvedValue({
    id: "1",
    label: "2026-2027",
    is_current: true,
  }),
}));

vi.mock("../api/members", () => ({
  fetchOwnMembership: vi.fn(),
}));

import { fetchOwnMembership } from "../api/members";

const renewedMe: MeResponse = {
  user_id: "1",
  email: "renewed.member@up.edu.ph",
  full_name: "Test Member",
  membership_status: "RENEWED",
  roles: ["MEMBER"],
  permissions: ["view_renewal_info"],
  route_keys: ["renew_membership"],
};

const notRenewedMe: MeResponse = {
  ...renewedMe,
  membership_status: "NOT_RENEWED",
};

describe("RenewalsPageContent", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows renewal hero when not renewed with portal button", async () => {
    vi.mocked(fetchOwnMembership).mockResolvedValue({
      academic_year_label: "2026-2027",
      membership_status: "NOT_RENEWED",
      renewed_at: null,
      needs_renewal: true,
    });
    render(
      <MemoryRouter>
        <RenewalsPageContent me={notRenewedMe} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Renew your membership for this academic year/i)).toBeTruthy();
      expect(screen.getAllByRole("link", { name: /Open membership portal/i })).toHaveLength(1);
      expect(screen.queryByRole("heading", { name: "Membership Details" })).toBeNull();
    });
  });

  it("shows renewed hero when already renewed", async () => {
    vi.mocked(fetchOwnMembership).mockResolvedValue({
      academic_year_label: "2026-2027",
      membership_status: "RENEWED",
      renewed_at: "2026-08-01T00:00:00Z",
      needs_renewal: false,
    });

    render(
      <MemoryRouter>
        <RenewalsPageContent me={renewedMe} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Membership" })).toBeTruthy();
      expect(screen.getByText(/You're all set for this academic year/i)).toBeTruthy();
      expect(screen.getAllByRole("link", { name: /Open membership portal/i })).toHaveLength(1);
    });
  });
});
