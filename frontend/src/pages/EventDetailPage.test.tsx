import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { EventDetailPage } from "./EventDetailPage";

vi.mock("../api/events", () => ({
  fetchEvent: vi.fn(),
}));

import { fetchEvent } from "../api/events";

describe("EventDetailPage", () => {
  it("renders event title and period", async () => {
    vi.mocked(fetchEvent).mockResolvedValue({
      id: "ga",
      title: "General Assembly",
      description: null,
      category: "ORGANIZATION",
      starts_on: "2026-09-15",
      ends_on: null,
      start_time: null,
      end_time: null,
      location: null,
      is_flagship: false,
      image_url: null,
      link_url: null,
      display_order: 0,
      is_active: true,
      created_at: "",
      updated_at: "",
    });

    render(
      <MemoryRouter initialEntries={["/calendar/ga"]}>
        <Routes>
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "General Assembly" })).toBeTruthy();
      expect(screen.getByText(/September 15, 2026/i)).toBeTruthy();
    });
  });

  it("shows time and location when the event has them", async () => {
    vi.mocked(fetchEvent).mockResolvedValue({
      id: "ga",
      title: "General Assembly",
      description: null,
      category: "ORGANIZATION",
      starts_on: "2026-09-15",
      ends_on: null,
      start_time: "18:00:00",
      end_time: "20:00:00",
      location: "EEEI Room 120",
      is_flagship: false,
      image_url: null,
      link_url: null,
      display_order: 0,
      is_active: true,
      created_at: "",
      updated_at: "",
    });

    render(
      <MemoryRouter initialEntries={["/calendar/ga"]}>
        <Routes>
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Time:/)).toBeTruthy();
      expect(screen.getByText(/EEEI Room 120/)).toBeTruthy();
    });
  });

  it("shows not found for unknown event", async () => {
    vi.mocked(fetchEvent).mockRejectedValue(new Error("not found"));

    render(
      <MemoryRouter initialEntries={["/calendar/unknown"]}>
        <Routes>
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Event not found")).toBeTruthy();
    });
  });
});
