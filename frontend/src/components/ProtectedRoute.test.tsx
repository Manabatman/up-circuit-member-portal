import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("../api/auth", () => ({
  fetchMe: vi.fn(),
}));

import { fetchMe } from "../api/auth";

describe("ProtectedRoute", () => {
  it("redirects to login when session bootstrap fails", async () => {
    vi.mocked(fetchMe).mockRejectedValue(new Error("401"));

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Login screen")).toBeTruthy();
    });
  });
});
