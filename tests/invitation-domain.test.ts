import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  invitationPath,
  invitationUrl,
  isInvitationOrigin,
  resolveInvitationDomain,
} from "../src/lib/invitation-url";
import { proxy } from "../src/proxy";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("Nyotaa couple domains", () => {
  it.each(["https://nyotaa.app", "https://www.nyotaa.app"])(
    "uses the same domain for routing and sharing on %s",
    async (appUrl) => {
      vi.stubEnv("APP_URL", appUrl);
      vi.stubEnv("APP_MODE", "test");
      vi.stubEnv("VERCEL_ENV", "preview");
      vi.stubEnv("INVITATION_DOMAIN", "");
      const { env } = await import("../src/server/env");
      const domain = env().INVITATION_DOMAIN;
      expect(domain).toBe("nyotaa.app");
      expect(invitationUrl(appUrl, "feneelnidharmi", domain)).toBe(
        "https://feneelnidharmi.nyotaa.app",
      );
      expect(
        invitationPath(
          appUrl,
          "feneelnidharmi",
          "feneelnidharmi.nyotaa.app",
          domain,
        ),
      ).toBe("/");
      expect(
        isInvitationOrigin(
          "https://feneelnidharmi.nyotaa.app",
          appUrl,
          "feneelnidharmi",
          domain,
        ),
      ).toBe(true);
      expect(
        isInvitationOrigin(
          "https://anothercouple.nyotaa.app",
          appUrl,
          "feneelnidharmi",
          domain,
        ),
      ).toBe(false);

      for (const path of ["/", "/details", "/social"]) {
        const response = proxy(
          new NextRequest(`https://feneelnidharmi.nyotaa.app${path}?lang=gu`, {
            headers: { host: "feneelnidharmi.nyotaa.app" },
          }),
        );
        expect(response.headers.get("x-middleware-rewrite")).toBe(
          `https://feneelnidharmi.nyotaa.app/w/feneelnidharmi${path === "/" ? "" : path}?lang=gu`,
        );
      }
    },
  );

  it.each([
    "nyotaa.app",
    "www.nyotaa.app",
    "api.nyotaa.app",
    "admin.nyotaa.app",
    "nested.couple.nyotaa.app",
    "couple.nyotaa.app.attacker.example",
  ])("does not rewrite %s as an invitation", (hostname) => {
    vi.stubEnv("APP_URL", "https://nyotaa.app");
    vi.stubEnv("INVITATION_DOMAIN", "");
    const response = proxy(
      new NextRequest(`https://${hostname}/`, {
        headers: { host: hostname, "x-invitation-host": "spoofed.nyotaa.app" },
      }),
    );
    expect(response.headers.get("x-middleware-rewrite")).toBeNull();
    expect(
      response.headers.get("x-middleware-request-x-invitation-host"),
    ).toBeNull();
  });

  it.each([
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "https://nyota-preview.vercel.app",
    "https://nyotaa.app.attacker.example",
  ])("keeps path links for %s", (appUrl) => {
    const domain = resolveInvitationDomain(appUrl);
    expect(domain).toBeUndefined();
    expect(invitationUrl(appUrl, "feneelnidharmi", domain)).toBe(
      `${appUrl}/w/feneelnidharmi`,
    );
  });

  it("preserves explicitly configured domains", () => {
    expect(
      resolveInvitationDomain("https://www.nyotaa.app", " Invites.Example "),
    ).toBe("invites.example");
    expect(resolveInvitationDomain("http://127.0.0.1:3001", "localhost")).toBe(
      "localhost",
    );
  });
});
