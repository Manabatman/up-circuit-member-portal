import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyState, membershipStatusLabel, StatusBadge } from "./ui";

describe("membershipStatusLabel", () => {
  it("maps database enums to member-facing labels", () => {
    expect(membershipStatusLabel("RENEWED")).toBe("Renewed");
    expect(membershipStatusLabel("NOT_RENEWED")).toBe("Renewal needed");
    expect(membershipStatusLabel("PENDING")).toBe("Pending review");
  });
});

describe("StatusBadge", () => {
  it("renders human-readable membership status", () => {
    render(<StatusBadge status="NOT_RENEWED" />);
    expect(screen.getByText("Renewal needed")).toBeTruthy();
    expect(screen.queryByText("NOT RENEWED")).toBeNull();
  });
});

describe("EmptyState", () => {
  it("renders title, message, and action", () => {
    render(
      <EmptyState
        title="Nothing here yet"
        message="Content will appear when published."
        action={<a href="/resources">Browse Resources</a>}
      />,
    );
    expect(screen.getByText("Nothing here yet")).toBeTruthy();
    expect(screen.getByText("Content will appear when published.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Browse Resources" })).toBeTruthy();
  });
});
