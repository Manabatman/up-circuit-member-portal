import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { SqueezeWorkspacePage } from "./SqueezeWorkspacePage";

describe("SqueezeWorkspacePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows workspace with external tool resources", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SqueezeWorkspacePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "SquEEEze" })).toBeTruthy();
    expect(screen.queryByText(/sample/i)).toBeNull();

    await user.click(screen.getByRole("button", { name: "Resources" }));
    expect(screen.getByText("Operations")).toBeTruthy();
    expect(screen.getByText("Manpower Tracker")).toBeTruthy();
    expect(screen.getAllByText(/Opens in Google Sheets/i).length).toBeGreaterThan(0);
  });

  it("shows honest empty state on People tab", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SqueezeWorkspacePage />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "People" }));
    expect(screen.getByText("Team listings are not in the portal yet.")).toBeTruthy();
  });
});
