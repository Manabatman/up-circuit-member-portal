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

vi.mock("../api/resources", () => ({
  fetchResources: vi.fn().mockResolvedValue({
    items: [],
    meta: { total: 0, offset: 0, limit: 50 },
  }),
}));

describe("CalendarPage", () => {
  it("shows schedule layout, month grid, and up next panel", async () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByText("SCHEDULE")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByLabelText("Month view")).toBeTruthy();
      expect(screen.getByText("UP NEXT")).toBeTruthy();
      expect(screen.getAllByText("General Assembly").length).toBeGreaterThan(0);
      expect(screen.getByText(/scheduled event/i)).toBeTruthy();
      expect(screen.getByRole("heading", { name: "Course exam schedule" })).toBeTruthy();
      expect(
        screen.getByText(/Official EEE exam dates—other year levels may share the same course/i),
      ).toBeTruthy();
    });
  });
});
