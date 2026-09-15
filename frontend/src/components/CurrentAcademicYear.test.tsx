import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CurrentAcademicYear } from "./CurrentAcademicYear";

describe("CurrentAcademicYear", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the academic year label from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "00000000-0000-0000-0000-000000000001",
          start_year: 2026,
          label: "2026-2027",
          is_current: true,
          renewal_opens_at: null,
          renewal_closes_at: null,
          created_at: "2026-09-05T00:00:00Z",
          updated_at: "2026-09-05T00:00:00Z",
        }),
      }),
    );

    render(<CurrentAcademicYear />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "2026-2027" })).toBeTruthy();
    });
    expect(screen.getByText("Start year 2026")).toBeTruthy();
  });
});
