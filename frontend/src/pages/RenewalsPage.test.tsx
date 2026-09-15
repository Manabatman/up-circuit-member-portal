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

  it("urges renewal when not renewed with primary portal button", async () => {
    render(
      <MemoryRouter>
        <RenewalsPageContent me={notRenewedMe} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Complete renewal on the official UP Circuit Membership Portal/i)).toBeTruthy();
      expect(screen.getByRole("link", { name: /Open Membership Portal/i })).toBeTruthy();
    });
  });

  it("shows renewed copy when already renewed", async () => {
    render(
      <MemoryRouter>
        <RenewalsPageContent me={renewedMe} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Membership" })).toBeTruthy();
      expect(screen.getByText(/You're renewed for AY 2026-2027/i)).toBeTruthy();
      expect(screen.getByRole("link", { name: /Open Membership Portal/i })).toBeTruthy();
    });
  });
});
