import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  getSession: vi.fn(),
  createAuth: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("better-auth", () => ({
  betterAuth: mocks.createAuth.mockReturnValue({
    api: { getSession: mocks.getSession },
  }),
}));
vi.mock("better-auth/adapters/drizzle", () => ({ drizzleAdapter: vi.fn() }));
vi.mock("@/server/db", () => ({ db: vi.fn() }));
vi.mock("@/server/email", () => ({ sendEmail: vi.fn() }));
vi.mock("@/server/env", () => ({
  env: () => ({
    APP_URL: "https://www.example.test",
    DATABASE_URL: "configured",
    BETTER_AUTH_SECRET: "test-secret",
  }),
}));

import { currentUser } from "@/server/auth";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getSession.mockResolvedValue(null);
});

it("skips auth initialization and session lookup for signed-out visitors", async () => {
  mocks.headers.mockResolvedValue(new Headers({ cookie: "owner-language=en" }));
  expect(await currentUser()).toBeNull();
  expect(mocks.createAuth).not.toHaveBeenCalled();
  expect(mocks.getSession).not.toHaveBeenCalled();
});

it.each(["better-auth.session_token", "__Secure-better-auth.session_token"])(
  "validates an existing %s cookie with the auth server",
  async (name) => {
    const headers = new Headers({ cookie: `${name}=test-token` });
    mocks.headers.mockResolvedValue(headers);
    mocks.getSession.mockResolvedValue({ user: { id: "verified-user" } });
    expect(await currentUser()).toEqual({ id: "verified-user" });
    expect(mocks.getSession).toHaveBeenCalledWith({ headers });
  },
);

it("does not treat a rejected session cookie as authentication", async () => {
  mocks.headers.mockResolvedValue(
    new Headers({ cookie: "__Secure-better-auth.session_token=invalid" }),
  );
  expect(await currentUser()).toBeNull();
  expect(mocks.getSession).toHaveBeenCalledOnce();
});
