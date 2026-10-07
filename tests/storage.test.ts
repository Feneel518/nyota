import { describe, expect, it } from "vitest";
import { isMissingObject } from "../src/server/storage";

describe("storage errors", () => {
  it("recognises missing S3 objects without masking other failures", () => {
    expect(isMissingObject({ name: "NoSuchKey" })).toBe(true);
    expect(isMissingObject({ name: "AccessDenied" })).toBe(false);
    expect(isMissingObject(new Error("network failure"))).toBe(false);
  });
});
