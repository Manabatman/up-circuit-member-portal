import { describe, expect, it } from "vitest";

import {
  ApiNetworkError,
  ApiRequestError,
  describeApiError,
} from "./client";

describe("describeApiError", () => {
  it("maps network failures to a user-facing message", () => {
    expect(describeApiError(new ApiNetworkError())).toMatch(
      /Unable to reach the server/i,
    );
  });

  it("maps HTTP status codes to user-facing messages", () => {
    expect(describeApiError(new ApiRequestError("x", 401, "UNAUTHORIZED"))).toMatch(
      /session has expired/i,
    );
    expect(describeApiError(new ApiRequestError("x", 403, "FORBIDDEN"))).toMatch(
      /permission/i,
    );
    expect(describeApiError(new ApiRequestError("x", 500, "INTERNAL_ERROR"))).toMatch(
      /Server error/i,
    );
  });
});
