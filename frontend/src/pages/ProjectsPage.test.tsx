import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProjectsPage } from "./ProjectsPage";

vi.mock("../api/events", () => ({
  fetchEvents: vi.fn().mockResolvedValue({
    items: [
      {
        id: "sq",
        title: "SquEEEze",
        description: "Flagship outreach",
        category: "EVENT",
        starts_on: "2026-11-01",
        ends_on: "2026-11-30",
        is_flagship: true,
        image_url: "/squeeze.jpg",
        link_url: "/projects/squeeeze",
        display_order: 0,
        is_active: true,
        created_at: "",
        updated_at: "",
      },
    ],
    meta: { total: 1, offset: 0, limit: 100 },
  }),
}));

describe("ProjectsPage", () => {
  it("lists flagship catalog including E-Waste and InteraCKT", async () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Flagship Events" })).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("SquEEEze")).toBeTruthy();
      expect(screen.getByText("InteraCKT")).toBeTruthy();
      expect(screen.getByText("The E-Waste Project")).toBeTruthy();
    });
  });
});
