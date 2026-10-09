import { expect, it, vi } from "vitest";

const { currentUser, listWeddings } = vi.hoisted(() => ({
  currentUser: vi.fn().mockResolvedValue(null),
  listWeddings: vi.fn(),
}));
vi.mock("@/server/auth", () => ({ currentUser }));
vi.mock("@/server/weddings", () => ({ listWeddings }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

import Dashboard from "@/app/dashboard/page";

it("redirects an unauthenticated dashboard render before reading private data", async () => {
  await expect(Dashboard()).rejects.toThrow("REDIRECT:/sign-in");
  expect(listWeddings).not.toHaveBeenCalled();
});
