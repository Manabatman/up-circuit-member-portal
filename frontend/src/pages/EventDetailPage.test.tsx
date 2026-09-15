import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { EventDetailPage } from "./EventDetailPage";

describe("EventDetailPage", () => {
  it("renders event title and period", () => {
    render(
      <MemoryRouter initialEntries={["/calendar/general-assembly-2026-09"]}>
        <Routes>
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "General Assembly" })).toBeTruthy();
    expect(screen.getByText("September 2026")).toBeTruthy();
    expect(screen.queryByText(/sample/i)).toBeNull();
  });

  it("shows not found for unknown event", () => {
    render(
      <MemoryRouter initialEntries={["/calendar/unknown"]}>
        <Routes>
          <Route path="/calendar/:eventId" element={<EventDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Event not found")).toBeTruthy();
  });
});
