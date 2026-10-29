import { describe, expect, it } from "vitest";

import type { Resource } from "../api/resources";
import { orgResourcesNotInTiles } from "./orgResourceTiles";

function resource(partial: Partial<Resource> & Pick<Resource, "id" | "title">): Resource {
  return {
    id: partial.id,
    title: partial.title,
    url: partial.url ?? "https://example.org/doc",
    description: partial.description ?? null,
    resource_type: partial.resource_type ?? "LINK",
    is_active: partial.is_active ?? true,
    category_id: partial.category_id ?? "cat-1",
    division_id: partial.division_id ?? null,
    display_order: partial.display_order ?? 0,
    category: partial.category ?? {
      id: "cat-1",
      scope: "ORGANIZATIONAL",
      name: "Forms",
      description: null,
      display_order: 0,
      is_active: true,
    },
  };
}

describe("orgResourcesNotInTiles", () => {
  it("includes active resources without a matching tile title", () => {
    const items = orgResourcesNotInTiles([
      resource({ id: "1", title: "UP Circuit Constitution" }),
      resource({ id: "2", title: "New officer handbook" }),
    ]);
    expect(items.map((r) => r.title)).toEqual(["New officer handbook"]);
  });
});
