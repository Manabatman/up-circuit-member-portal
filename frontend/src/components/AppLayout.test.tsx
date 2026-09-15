import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import type { MeResponse } from "../api/auth";
import { AppLayout } from "./AppLayout";

vi.mock("../api/auth", () => ({
  logout: vi.fn(),
}));

const renewedMe: MeResponse = {
  user_id: "1",
  email: "renewed.member@up.edu.ph",
  full_name: "Lebron James",
  membership_status: "RENEWED",
  roles: ["MEMBER"],
  permissions: ["view_dashboard", "view_resources", "view_academic_resources"],
  route_keys: ["dashboard", "resources", "academic_drive", "renew_membership"],
};

const notRenewedMe: MeResponse = {
  ...renewedMe,
  membership_status: "NOT_RENEWED",
  route_keys: ["dashboard", "resources"],
};

describe("AppLayout", () => {
  it("hides Academic Drive when route key is absent", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout me={notRenewedMe} />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Academic Drive")).toBeNull();
    expect(screen.getByText("Resources")).toBeTruthy();
  });

  it("shows grouped navigation with Calendar and Flagship Events under Discover", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout me={renewedMe} />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Home").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Discover").length).toBeGreaterThan(0);
      expect(screen.queryByText("Circuit Work")).toBeNull();
      expect(screen.getAllByText("Calendar").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Flagship Events").length).toBeGreaterThan(0);
    });
  });

  it("shows Renew Membership when route key is present", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout me={renewedMe} />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Renew Membership").length).toBeGreaterThan(0);
    });
  });

  it("keeps Renew Membership with My Account after Discover regardless of renewal status", async () => {
    const needsRenewalMe: MeResponse = {
      ...notRenewedMe,
      route_keys: ["dashboard", "resources", "renew_membership", "account"],
    };

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout me={needsRenewalMe} />} />
        </Routes>
      </MemoryRouter>,
    );

    const nav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).toBeTruthy();
    const hrefs = [...nav!.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(hrefs.indexOf("/dashboard")).toBeLessThan(hrefs.indexOf("/calendar"));
    expect(hrefs.indexOf("/projects")).toBeLessThan(hrefs.indexOf("/account"));
    expect(hrefs.indexOf("/account")).toBeLessThan(hrefs.indexOf("/renewals"));
  });

  it("orders nav with My Account before Renew for renewed members", async () => {
    const meWithAccount: MeResponse = {
      ...renewedMe,
      route_keys: [
        "dashboard",
        "account",
        "resources",
        "academic_drive",
        "divisions",
        "member_directory",
        "renew_membership",
      ],
    };

    const { container } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout me={meWithAccount} />} />
        </Routes>
      </MemoryRouter>,
    );

    const nav = container.querySelector('nav[aria-label="Main navigation"]');
    expect(nav).toBeTruthy();
    const hrefs = [...nav!.querySelectorAll("a")].map((link) => link.getAttribute("href"));
    expect(hrefs.indexOf("/account")).toBeLessThan(hrefs.indexOf("/renewals"));
    expect(hrefs.indexOf("/calendar")).toBeLessThan(hrefs.indexOf("/academic-drive"));
  });

  it("shows Academic Drive for renewed members", async () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={<AppLayout me={renewedMe} />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByRole("link", { name: "Academic Drive" }).length).toBeGreaterThan(0);
    });
  });
});
