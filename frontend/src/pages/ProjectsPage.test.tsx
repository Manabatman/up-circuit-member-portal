import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";

import { ProjectsPage } from "./ProjectsPage";

describe("ProjectsPage", () => {
  it("lists SquEEEze workspace and coming-soon flagships", () => {
    render(
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Flagship Events" })).toBeTruthy();
    expect(screen.getByText("SquEEEze")).toBeTruthy();
    expect(screen.getByText("InteraCKT")).toBeTruthy();
    expect(screen.getByText("The E-Waste Project")).toBeTruthy();
    expect(screen.getAllByText("Coming soon").length).toBeGreaterThanOrEqual(2);
  });
});
