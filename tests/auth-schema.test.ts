import { describe, expect, it } from "vitest";
import { getAuthTables } from "better-auth/db";
import { magicLink } from "better-auth/plugins";
import { getTableColumns } from "drizzle-orm";
import {
  user,
  session,
  account,
  verification,
  rateLimit,
} from "../src/server/db/schema";
describe("Installed Better Auth schema compatibility", () => {
  it("covers every field required by the installed magic-link plugin and database rate limiter", () => {
    const expected = getAuthTables({
      rateLimit: { enabled: true, storage: "database" },
      plugins: [
        magicLink({ storeToken: "hashed", sendMagicLink: async () => {} }),
      ],
    });
    const actual = { user, session, account, verification, rateLimit };
    for (const [name, table] of Object.entries(expected)) {
      const model = actual[name as keyof typeof actual];
      expect(model, `Missing auth model ${name}`).toBeDefined();
      const columns = getTableColumns(model);
      for (const field of Object.keys(table.fields))
        expect(columns, `${name}.${field}`).toHaveProperty(field);
    }
  });
});
