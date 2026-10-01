import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginPage } from "./LoginPage";

vi.mock("../api/auth", () => ({
  login: vi.fn(),
  verifyCode: vi.fn(),
}));

import { login } from "../api/auth";

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });

  it(
    "validates password length before submit",
    async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "member@up.edu.ph");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(screen.getByText(/at least 12 characters/i)).toBeTruthy();
    expect(login).not.toHaveBeenCalled();
  },
    10000,
  );

  it("shows first-time renewal path on the sign-in step only", async () => {
    const user = userEvent.setup({ delay: null });
    vi.mocked(login).mockResolvedValue({ verification_required: true });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /create an account/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /don't have a member portal account yet/i })).toBeTruthy();

    await user.type(screen.getByLabelText(/email/i), "member@up.edu.ph");
    await user.type(screen.getByLabelText(/^password$/i), "validpassword12");
    await user.click(screen.getByRole("button", { name: /log in/i }));

    expect(await screen.findByRole("heading", { name: /verification code/i })).toBeTruthy();
    expect(screen.queryByRole("heading", { name: /don't have a member portal account yet/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /create an account/i })).toBeNull();
  });
});
