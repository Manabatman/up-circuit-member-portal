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
  fetchOwnMembership: vi.fn().mockResolvedValue({
    academic_year_label: "AY 2026-2027",
    membership_status: "RENEWED",
    renewed_at: "2026-08-01T00:00:00Z",
    needs_renewal: false,
  }),
}));

vi.mock("../api/resources", () => ({
  fetchResources: vi.fn(),
}));

vi.mock("../api/events", () => ({
  fetchEvents: vi.fn().mockResolvedValue({
    items: [
      {
        id: "e1",
        title: "General Assembly",
        description: null,
        category: "ORGANIZATION",
        starts_on: "2026-12-01",
        ends_on: null,
        start_time: "18:00:00",
        end_time: null,
        location: "EEEI Room 120",
        is_flagship: false,
        image_url: null,
        link_url: null,
        display_order: 0,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ],
    meta: { total: 1, offset: 0, limit: 100 },
  }),
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
  it("shows redesigned dashboard sections and dynamic content", async () => {
    vi.mocked(fetchResources).mockImplementation(async (scope) => {
      if (scope === "academic") {
        return {
          items: [
            {
              id: "a1",
              category_id: "c1",
              division_id: null,
              title: VERIFIED_RESOURCE_TITLES.academicDrive,
              description: null,
              url: "https://drive.google.com/academic",
              resource_type: "GOOGLE_DRIVE",
              display_order: 0,
              is_active: true,
              category: {
                id: "c1",
                scope: "ACADEMIC",
                name: "Academic Drive",
                description: null,
                display_order: 0,
                is_active: true,
              },
            },
          ],
          meta: { total: 1, offset: 0, limit: 50 },
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
        expect(screen.getByText("Where do you need to go?")).toBeTruthy();
        expect(screen.getByText("START HERE")).toBeTruthy();
        expect(screen.getByText("This week")).toBeTruthy();
        expect(screen.getByText("View calendar →")).toBeTruthy();
        expect(screen.getByText("General Assembly")).toBeTruthy();
        expect(screen.getByText("Circuit Constitution")).toBeTruthy();
        expect(screen.getByText(/You're all set for this academic year/i)).toBeTruthy();
        expect(screen.getByText("Open membership portal")).toBeTruthy();
        expect(screen.queryByText("Upcoming")).toBeNull();
        expect(screen.queryByText("Quick access")).toBeNull();
      },
      { timeout: 3000 },
    );
  });
});
