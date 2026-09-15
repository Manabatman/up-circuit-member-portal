import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AdminResourcesPage } from "./AdminResourcesPage";

vi.mock("../../api/resources", () => ({
  fetchResources: vi.fn(),
  fetchResourceCategories: vi.fn(),
  createResource: vi.fn(),
  updateResource: vi.fn(),
  deactivateResource: vi.fn(),
}));

import {
  fetchResourceCategories,
  fetchResources,
  updateResource,
} from "../../api/resources";

describe("AdminResourcesPage", () => {
  it(
    "saves an edited resource URL",
    async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(fetchResources).mockResolvedValue({
      items: [
        {
          id: "res-1",
          category_id: "cat-1",
          division_id: null,
          title: "Shared Notes",
          description: null,
          url: "https://drive.google.com/old-url",
          resource_type: "GOOGLE_DRIVE",
          display_order: 0,
          is_active: true,
          category: {
            id: "cat-1",
            scope: "ACADEMIC",
            name: "Course Materials",
            description: null,
            display_order: 0,
            is_active: true,
          },
        },
      ],
      meta: { total: 1, offset: 0, limit: 50 },
    });
    vi.mocked(fetchResourceCategories).mockResolvedValue({
      items: [
        {
          id: "cat-1",
          scope: "ACADEMIC",
          name: "Course Materials",
          description: null,
          display_order: 0,
          is_active: true,
        },
      ],
      meta: { total: 1, offset: 0, limit: 0 },
    });
    vi.mocked(updateResource).mockResolvedValue({
      id: "res-1",
      category_id: "cat-1",
      division_id: null,
      title: "Shared Notes",
      description: null,
      url: "https://drive.google.com/new-url",
      resource_type: "GOOGLE_DRIVE",
      display_order: 0,
      is_active: true,
      category: {
        id: "cat-1",
        scope: "ACADEMIC",
        name: "Course Materials",
        description: null,
        display_order: 0,
        is_active: true,
      },
    });

    render(
      <MemoryRouter>
        <AdminResourcesPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Shared Notes")).toBeTruthy();
    });

    const row = screen.getByRole("row", { name: /Shared Notes/i });
    await user.click(row.querySelector("button")!);
    const urlInput = screen.getByLabelText(/^url$/i);
    await user.clear(urlInput);
    await user.type(urlInput, "https://drive.google.com/new-url");
    await user.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateResource).toHaveBeenCalledWith(
        "res-1",
        expect.objectContaining({ url: "https://drive.google.com/new-url" }),
      );
    });
  },
    15000,
  );
});
