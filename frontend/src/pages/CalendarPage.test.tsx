import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { CalendarPage } from "./CalendarPage";

vi.mock("../api/events", () => ({
  fetchEvents: vi.fn().mockResolvedValue({
    items: [
      {
        id: "ga",
        title: "General Assembly",
        description: null,
        category: "ORGANIZATION",
        starts_on: "2026-10-15",
        ends_on: null,
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

describe("CalendarPage", () => {
  it("shows events inside the month grid", async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByLabelText("Month view")).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText("General Assembly")).toBeTruthy();
    });
  });
});
