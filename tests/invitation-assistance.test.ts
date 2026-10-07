import { afterEach, describe, expect, it, vi } from "vitest";
import { emptyContent, contentSchema } from "../src/lib/content";
import {
  applyGujarati,
  missingGujarati,
} from "../src/lib/gujarati-translation";
import {
  invitationUrl,
  invitationSlug,
  invitationPath,
  suggestedCoupleSlug,
} from "../src/lib/invitation-url";
import {
  translateGujarati,
  translationSegments,
} from "../src/server/translation";
import { checkOrigin } from "../src/server/security";
import { env } from "../src/server/env";
import * as environment from "../src/server/env";
import { NextRequest } from "next/server";
import { proxy } from "../src/proxy";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("Gujarati assistance", () => {
  it("keeps old revisions readable and round-trips optional mother names", () => {
    const old = emptyContent();
    delete old.motherNames;
    expect(contentSchema.parse(old).motherNames).toBeUndefined();
    old.motherNames = [
      { en: "Meena", gu: "મીના" },
      { en: "", gu: "" },
    ];
    expect(contentSchema.parse(old).motherNames?.[0].gu).toBe("મીના");
  });
  it("applies reviewed text without overwriting Gujarati or an English source edited in the meantime", () => {
    const content = emptyContent();
    content.names[0].en = "Aarya";
    content.motherNames![0].en = "Meena";
    content.welcome.en = "Join us for our wedding.";
    const candidates = missingGujarati(content, "couple");
    content.names[0].gu = "આર્યા";
    content.welcome.en = "A newer welcome message.";
    const updated = applyGujarati(content, candidates, [
      { id: "name:0", text: "બદલેલું નામ" },
      { id: "mother:0", text: "મીનાબેન" },
      { id: "welcome", text: "અમારા લગ્નમાં પધારશો." },
    ]);
    expect(updated.names[0].gu).toBe("આર્યા");
    expect(updated.welcome.gu).toBe("");
    expect(updated.motherNames![0].gu).toBe("મીનાબેન");
    expect(content.motherNames![0].gu).toBe("");
  });
  it("excludes archived functions and rejects translations too long for their field", () => {
    const content = emptyContent();
    content.events[0].venue.en = "Rose Garden";
    const candidates = missingGujarati(content, "events");
    const venueId = `event:${content.events[0].id}:venue`;
    expect(
      applyGujarati(content, candidates, [
        { id: venueId, text: "અ".repeat(151) },
      ]).events[0].venue.gu,
    ).toBe("");
    content.events[0].archived = true;
    expect(missingGujarati(content, "events")).toEqual([]);
    expect(
      applyGujarati(content, candidates, [{ id: venueId, text: "રોઝ ગાર્ડન" }])
        .events[0].venue.gu,
    ).toBe("");
  });
  it("splits long UTF-8 text without losing whitespace or exceeding the provider byte limit", () => {
    for (const text of [
      "A beautiful wedding celebration. ".repeat(40),
      "ગુજરાતી અને English 🌸 ".repeat(40),
      "🌸".repeat(350),
    ]) {
      const segments = translationSegments(text);
      expect(segments.join("")).toBe(text);
      expect(
        segments.every((segment) => Buffer.byteLength(segment, "utf8") <= 500),
      ).toBe(true);
    }
  });
  it("provides local wording translations without contacting the service", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(
      await translateGujarati(
        "Together with our families",
        AbortSignal.timeout(1000),
      ),
    ).toBe("અમારા પરિવાર સાથે");
    expect(fetch).not.toHaveBeenCalled();
  });
  it("decodes provider text and reports daily quota failures without applying the error as Gujarati", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            responseStatus: 200,
            responseData: { translatedText: "આપનું સ્વાગત &amp; અભિનંદન" },
          }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            responseStatus: 403,
            quotaFinished: true,
            responseData: { translatedText: "QUOTA EXCEEDED" },
          }),
        ),
      );
    vi.stubGlobal("fetch", fetch);
    expect(
      await translateGujarati(
        "Welcome and congratulations",
        AbortSignal.timeout(1000),
      ),
    ).toBe("આપનું સ્વાગત & અભિનંદન");
    await expect(
      translateGujarati("Another message", AbortSignal.timeout(1000)),
    ).rejects.toThrow("daily limit");
    const requested = new URL(fetch.mock.calls[0][0]);
    expect(requested.searchParams.get("langpair")).toBe("en|gu");
  });
});

describe("Invitation subdomains", () => {
  it("keeps rewrites internal while forwarding the validated subdomain and strips spoofed markers", () => {
    vi.stubEnv("APP_URL", "http://127.0.0.1:3001");
    vi.stubEnv("INVITATION_DOMAIN", "localhost");
    vi.stubEnv("__NEXT_NO_MIDDLEWARE_URL_NORMALIZE", "true");
    const rewritten = proxy(
      new NextRequest("http://127.0.0.1:3001/details", {
        headers: {
          host: "our-wedding.localhost:3001",
          "x-invitation-host": "spoofed.localhost",
        },
      }),
    );
    expect(rewritten.headers.get("x-middleware-rewrite")).toBe(
      "http://127.0.0.1:3001/w/our-wedding/details",
    );
    expect(
      rewritten.headers.get("x-middleware-request-x-invitation-host"),
    ).toBe("our-wedding.localhost");
    const main = proxy(
      new NextRequest("http://127.0.0.1:3001/w/our-wedding", {
        headers: {
          host: "127.0.0.1:3001",
          "x-invitation-host": "our-wedding.localhost",
        },
      }),
    );
    expect(
      main.headers.get("x-middleware-request-x-invitation-host"),
    ).toBeNull();
    expect(main.headers.get("x-middleware-rewrite")).toBeNull();
  });
  it("uses the configured wildcard domain and keeps path links when none is configured", () => {
    expect(
      invitationUrl("https://www.yourdomain.com", "www", "yourdomain.com"),
    ).toBe("https://www.yourdomain.com/w/www");
    expect(
      invitationPath(
        "https://www.yourdomain.com",
        "www",
        "WWW.yourdomain.com",
        "yourdomain.com",
      ),
    ).toBe("/w/www");
    expect(invitationUrl("http://127.0.0.1:3000", "feneelnidharmi")).toBe(
      "http://127.0.0.1:3000/w/feneelnidharmi",
    );
    expect(
      invitationUrl(
        "https://yourdomain.com",
        "feneelnidharmi",
        "yourdomain.com",
      ),
    ).toBe("https://feneelnidharmi.yourdomain.com");
    expect(invitationUrl("https://weddings.example", "feneelnidharmi")).toBe(
      "https://weddings.example/w/feneelnidharmi",
    );
    expect(invitationUrl("http://127.0.0.1:3000", "a".repeat(64))).toContain(
      "/w/",
    );
    expect(
      invitationSlug("feneelnidharmi.yourdomain.com", "yourdomain.com"),
    ).toBe("feneelnidharmi");
    expect(
      invitationSlug(
        "couple.yourdomain.com.attacker.example",
        "yourdomain.com",
      ),
    ).toBeNull();
    expect(
      invitationSlug("nested.couple.yourdomain.com", "yourdomain.com"),
    ).toBeNull();
    expect(invitationSlug("couple.yourdomain.com")).toBeNull();
    expect(
      suggestedCoupleSlug([
        { en: "Feneel", gu: "" },
        { en: "Nidharmi", gu: "" },
      ]),
    ).toBe("feneelnidharmi");
  });
  it("allows a guest’s own RSVP origin and rejects other invitations, ports, and owner requests", () => {
    vi.spyOn(environment, "env").mockReturnValue({
      ...env(),
      APP_MODE: "production",
      APP_URL: "https://yourdomain.com",
      INVITATION_DOMAIN: "yourdomain.com",
    });
    const base = new URL(env().APP_URL);
    const guest = new URL(base);
    guest.hostname = "our-wedding.yourdomain.com";
    const request = (origin: string) =>
      new Request(new URL("/api/public/our-wedding/rsvp", base), {
        headers: { origin },
      });
    expect(() =>
      checkOrigin(request(guest.origin), "our-wedding"),
    ).not.toThrow();
    expect(() => checkOrigin(request(guest.origin), "other-wedding")).toThrow(
      "untrusted page",
    );
    expect(() => checkOrigin(request(guest.origin))).toThrow("untrusted page");
    guest.port = String(Number(base.port || 80) + 1);
    expect(() => checkOrigin(request(guest.origin), "our-wedding")).toThrow(
      "untrusted page",
    );
    expect(() =>
      checkOrigin(
        request("https://our-wedding.yourdomain.com.attacker.example"),
        "our-wedding",
      ),
    ).toThrow("untrusted page");
  });
});
