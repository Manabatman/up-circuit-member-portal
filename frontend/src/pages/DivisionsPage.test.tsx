import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { DivisionsPage } from "./DivisionsPage";

vi.mock("../api/divisions", () => ({
  fetchDivisions: vi.fn().mockResolvedValue({
    items: [
      {
        id: "eb",
        name: "Executive Board",
        description: "The Executive Board oversees Circuit and its standing divisions.",
        display_order: -1,
        is_active: true,
        is_standing_division: false,
      },
      {
        id: "1",
        name: "Academic Affairs Division",
        description: "Verified intro from officers.",
        display_order: 0,
        is_active: true,
        is_standing_division: true,
      },
      {
        id: "2",
        name: "Finance Division",
        description: null,
        display_order: 1,
        is_active: true,
        is_standing_division: true,
      },
    ],
    meta: { total: 3 },
  }),
}));

vi.mock("../api/resources", () => ({
  fetchResources: vi.fn().mockImplementation(async (_scope, _inactive, divisionId) => ({
    items: divisionId === "1" ? [{ id: "r1" }] : [],
    meta: { total: divisionId === "1" ? 1 : 0, offset: 0, limit: 50 },
  })),
}));

describe("DivisionsPage", () => {
  it("renders hub cards including Executive Board as a link", async () => {
    render(
      <MemoryRouter>
        <DivisionsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Executive Board")).toBeTruthy();
      expect(screen.getByText(/oversees Circuit and its standing divisions/i)).toBeTruthy();
      expect(screen.getByText("Academic Affairs")).toBeTruthy();
      expect(screen.getByText("Explore hub")).toBeTruthy();
      expect(screen.getAllByText("Explore division").length).toBe(2);
      expect(screen.getByRole("link", { name: /Executive Board/i })).toBeTruthy();
    });
  });
});
