import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "../api/auth";
import { VERIFIED_RESOURCE_TITLES } from "../constants";
import { AcademicDrivePage } from "./AcademicDrivePage";

vi.mock("../api/resources", () => ({
  fetchResources: vi.fn(),
}));

import { fetchResources } from "../api/resources";

describe("AcademicDrivePage", () => {
  it("shows membership required state", async () => {
    vi.mocked(fetchResources).mockRejectedValue(
      new ApiRequestError("Membership renewal required.", 403, "MEMBERSHIP_REQUIRED"),
    );

    render(
      <MemoryRouter>
        <AcademicDrivePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/membership renewal required/i)).toBeTruthy();
    });
  });

  it("shows a primary button for the official academic drive", async () => {
    vi.mocked(fetchResources).mockResolvedValue({
      items: [
        {
          id: "drive",
          category_id: "c1",
          division_id: null,
          title: VERIFIED_RESOURCE_TITLES.academicDrive,
          description: null,
          url: "https://drive.google.com/drive/folders/demo",
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
    });

    render(
      <MemoryRouter>
        <AcademicDrivePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/central hub for academic materials/i)).toBeTruthy();
      const driveLink = screen.getByRole("link", { name: /open full academic drive/i });
      expect(driveLink.getAttribute("href")).toBe("https://drive.google.com/drive/folders/demo");
    });
  });

  it("renders grouped resources", async () => {
    vi.mocked(fetchResources).mockResolvedValue({
      items: [
        {
          id: "1",
          category_id: "c1",
          division_id: null,
          title: "Circuit Notes",
          description: "Demo notes",
          url: "https://drive.google.com/demo",
          resource_type: "GOOGLE_DRIVE",
          display_order: 0,
          is_active: true,
          category: {
            id: "c1",
            scope: "ACADEMIC",
            name: "Course Materials",
            description: null,
            display_order: 0,
            is_active: true,
          },
        },
      ],
      meta: { total: 1, offset: 0, limit: 50 },
    });

    render(
      <MemoryRouter>
        <AcademicDrivePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Circuit Notes" })).toBeTruthy();
    });
  });
});
