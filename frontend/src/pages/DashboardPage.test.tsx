import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { MeResponse } from "../api/auth";
import { VERIFIED_RESOURCE_TITLES } from "../constants";
import { DashboardPage } from "./DashboardPage";

vi.mock("../api/academicYear", () => ({
  fetchCurrentAcademicYear: vi.fn().mockResolvedValue({
    id: "1",
    label: "2026-2027",
    is_current: true,
  }),
}));

vi.mock("../api/members", () => ({
  fetchOwnProfile: vi.fn().mockResolvedValue({
    user_id: "1",
    email: "test@up.edu.ph",
    full_name: "Test Member",
    degree_program: "BS ECE",
    year_level: "3",
    student_number: null,
    contact_number: null,
    batch: null,
    membership_status: "RENEWED",
  }),
}));

vi.mock("../api/resources", () => ({
  fetchResources: vi.fn(),
}));

import { fetchResources } from "../api/resources";

const renewedMe: MeResponse = {
  user_id: "1",
  email: "renewed.member@up.edu.ph",
  full_name: "Test Member",
  membership_status: "RENEWED",
  roles: ["MEMBER"],
  permissions: ["view_dashboard"],
  route_keys: [
    "dashboard",
    "resources",
    "academic_drive",
    "divisions",
    "member_directory",
    "renew_membership",
  ],
};

describe("DashboardPage", () => {
  it("shows upcoming events and constitution when verified resource exists", async () => {
    vi.mocked(fetchResources).mockImplementation(async (scope) => {
      if (scope === "academic") {
        return {
          items: [],
          meta: { total: 0, offset: 0, limit: 50 },
        };
      }
      return {
        items: [
          {
            id: "o1",
            category_id: "c2",
            division_id: null,
            title: VERIFIED_RESOURCE_TITLES.constitution,
            description: null,
            url: "https://drive.google.com/file/d/demo",
            resource_type: "GOOGLE_DRIVE",
            display_order: 0,
            is_active: true,
            category: {
              id: "c2",
              scope: "ORGANIZATIONAL",
              name: "Organizational Documents",
              description: null,
              display_order: 0,
              is_active: true,
            },
          },
        ],
        meta: { total: 1, offset: 0, limit: 50 },
      };
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<Outlet context={renewedMe} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(
      () => {
        expect(screen.getByText("Upcoming")).toBeTruthy();
        expect(screen.getByText("View calendar")).toBeTruthy();
        expect(screen.getByText("Official documents")).toBeTruthy();
        expect(screen.getByText(VERIFIED_RESOURCE_TITLES.constitution)).toBeTruthy();
        expect(screen.queryByText("Explore")).toBeNull();
        expect(screen.queryByText("Continue")).toBeNull();
        expect(screen.queryByText(/sample/i)).toBeNull();
      },
      { timeout: 3000 },
    );
  });
});
