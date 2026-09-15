import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { CalendarPage } from "./CalendarPage";

describe("CalendarPage", () => {
  it("shows events inside the month grid without a separate agenda", () => {
    render(
      <MemoryRouter>
        <CalendarPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByText(/not the official Circuit calendar/i)).toBeTruthy();
    expect(screen.queryByText("Agenda")).toBeNull();
    expect(screen.getByLabelText("Month view")).toBeTruthy();
    expect(screen.getAllByText("General Assembly").length).toBeGreaterThan(0);
  });
});
