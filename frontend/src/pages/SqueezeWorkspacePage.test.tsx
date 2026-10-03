import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { SQUEEEZE29_QUESTION_SHEET_URL } from "../content/squeeeze29";
import { SqueezeWorkspacePage } from "./SqueezeWorkspacePage";

describe("SqueezeWorkspacePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows the SquEEEze 29 question sheet instead of placeholder tools", () => {
    render(
      <MemoryRouter>
        <SqueezeWorkspacePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "SquEEEze" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "SquEEEze 29 questions" })).toBeTruthy();
    const sheet = screen.getByRole("link", { name: /open question sheet/i });
    expect(sheet.getAttribute("href")).toBe(SQUEEEZE29_QUESTION_SHEET_URL);
    expect(screen.queryByText("Manpower Tracker")).toBeNull();
    expect(screen.queryByText(/example.com/i)).toBeNull();
  });
});
